# Deploying the FITVA API on Windows Server + IIS

Everything runs on one Windows Server: IIS in front, the API inside IIS, PostgreSQL on the same
machine and reachable only from it.

```
Android app / website ──HTTPS 443──► IIS ──in-process──► FITVA API (.NET 10) ──localhost:5432──► PostgreSQL 16 (fitva_db)
```

Tested on a development PC (2026-10-25): the published Release build in Production mode, the
`database/deploy/*.sql` scripts on a fresh database, and a login + client + membership +
check-in + dashboard round trip as the limited `fitva_app` login. The IIS steps (§4–§5) were not
run here, because they need the server.

| What | Where |
|---|---|
| Publish script | `backend/deploy/publish.ps1` |
| IIS config (copied into the publish output) | `backend/src/FitvaApi/web.config` |
| Production settings (no secrets) | `backend/src/FitvaApi/appsettings.Production.json` |
| Database scripts | `database/deploy/01…04_*.sql`, `database/run_prod.sql` |
| Backup script | `database/deploy/backup.ps1` |

Use **long random passwords without `;`, `'` or `"`** (letters and digits, 24+ characters).
These characters would break the connection string or the commands below.

---

## 1. Prepare the server (once)

Windows Server 2019, 2022 or 2025, as Administrator:

```powershell
# IIS + management console
Install-WindowsFeature Web-Server, Web-Mgmt-Console -IncludeManagementTools
```

1. Install the **ASP.NET Core 10 Hosting Bundle** from <https://dotnet.microsoft.com/download/dotnet/10.0>
   (Windows, "Hosting Bundle"). Install it **after** IIS, then restart IIS:
   `net stop was /y; net start w3svc`
2. Install **PostgreSQL 16** (EDB installer). Put the data directory on a data drive if you have one.
   Note the `postgres` superuser password.
3. Copy the repo's `database\` folder to the server, e.g. `C:\fitva\database`.

## 2. Lock PostgreSQL down to this machine

In `C:\Program Files\PostgreSQL\16\data\postgresql.conf`:

```
listen_addresses = 'localhost'
```

In `pg_hba.conf`, replace the `host` lines with these, so each login can only reach its own
database and only from this machine:

```
# TYPE  DATABASE   USER                   ADDRESS        METHOD
host    fitva_db   fitva_app,fitva_owner  127.0.0.1/32   scram-sha-256
host    fitva_db   fitva_app,fitva_owner  ::1/128        scram-sha-256
host    all        postgres               127.0.0.1/32   scram-sha-256
host    all        postgres               ::1/128        scram-sha-256
```

```powershell
Restart-Service postgresql-x64-16
```

Don't open port 5432 in Windows Firewall.

## 3. Create the database (once)

```powershell
cd C:\fitva
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

# 1. Logins + database (as postgres). Two different strong passwords.
& $psql -U postgres -d postgres -v owner_password='OWNER_PASSWORD' -v app_password='APP_PASSWORD' -f database\deploy\01_create_roles_and_db.sql

# 2. Tables, views, functions. No demo data.
& $psql -U fitva_owner -d fitva_db -f database\run_prod.sql

# 3. Rights for the API login (no DELETE, no DDL)
& $psql -U fitva_owner -d fitva_db -f database\deploy\02_grants.sql

# 4. Your gym + the owner's login. Prints the gym id; keep it.
& $psql -U fitva_owner -d fitva_db -v gym_name='Your Gym Name' -v gym_branch='Area, City' -v owner_name='Owner Name' -v owner_email='owner@yourgym.in' -v owner_password='OWNER_LOGIN_PASSWORD' -f database\deploy\03_first_gym.sql

# 5. (optional) more staff logins: role = front_desk | trainer | owner
& $psql -U fitva_owner -d fitva_db -v gym_id='GYM_ID' -v role='front_desk' -v name='Desk Name' -v email='desk@yourgym.in' -v password='DESK_PASSWORD' -f database\deploy\04_add_staff_login.sql
```

Passwords given with `-v` end up in PowerShell's history. Afterwards, clear it with
`Clear-History` and delete `(Get-PSReadLineOption).HistorySavePath`.

## 4. Install the API in IIS

**On your PC**, build the package:

```powershell
powershell -File backend\deploy\publish.ps1     # → backend\publish\FitvaApi (about 6 MB)
```

Copy the `backend\publish\FitvaApi` folder to the server as `C:\inetpub\fitva-api`.

**On the server**, as Administrator:

```powershell
Import-Module WebAdministration
$site = "C:\inetpub\fitva-api"

# App pool without the .NET Framework CLR ("No Managed Code"), since ASP.NET Core runs its own runtime
New-WebAppPool -Name FitvaApi
Set-ItemProperty IIS:\AppPools\FitvaApi -Name managedRuntimeVersion -Value ""

# The site. Port 80 for now; HTTPS is added in §5.
Stop-Website "Default Web Site" -ErrorAction SilentlyContinue
New-Website -Name FitvaApi -PhysicalPath $site -ApplicationPool FitvaApi -Port 80

# The app writes daily log files to .\logs
New-Item -ItemType Directory -Force "$site\logs" | Out-Null
icacls "$site\logs" /grant "IIS AppPool\FitvaApi:(OI)(CI)M"
```

**Secrets** go on the app pool as environment variables. They stay in IIS's own configuration,
not in a file in the site folder:

```powershell
# A new random JWT signing key (64 bytes). Changing it later signs everyone out.
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $jwtKey = [Convert]::ToBase64String($b)

$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
& $appcmd set config -section:system.applicationHost/applicationPools "/+[name='FitvaApi'].environmentVariables.[name='ConnectionStrings__Fitva',value='Host=localhost;Port=5432;Database=fitva_db;Username=fitva_app;Password=APP_PASSWORD']" /commit:apphost
& $appcmd set config -section:system.applicationHost/applicationPools "/+[name='FitvaApi'].environmentVariables.[name='Jwt__Key',value='$jwtKey']" /commit:apphost

Restart-WebAppPool FitvaApi
```

To change a value later, remove it first with `/-[name='FitvaApi'].environmentVariables.[name='Jwt__Key']`,
then add it again.

**Check** on the server: <http://localhost/health> should return `{"status":"ok","database":"ok"}`.

## 5. Domain and HTTPS

The Android app needs HTTPS: Android blocks plain `http://` by default for release builds, and
logins and tokens must not travel unencrypted.

**Until you have a domain (testing only):**
- Use `http://SERVER-IP/` inside your own network or over a VPN.
- Open port 80 in the firewall only to your own IP, or not at all.
- In the Android app, allow cleartext **only in the debug build**, for that IP, with a
  `network_security_config.xml`.

**For real use (needed before launch):**
1. Buy a domain (about ₹800–1,000 a year) and create an **A record**, e.g. `api.yourgym.in` → the
   server's public IP.
2. Add the host name to the IIS site:
   `New-WebBinding -Name FitvaApi -Protocol http -Port 80 -HostHeader api.yourgym.in`
3. Get a free Let's Encrypt certificate with **win-acme** (<https://www.win-acme.com>). Run
   `wacs.exe`, choose the `FitvaApi` site, and accept the defaults. It creates the HTTPS (443)
   binding and renews the certificate automatically.
4. Open only 443 (and 80 for the redirect) in the firewall:
   ```powershell
   New-NetFirewallRule -DisplayName "FITVA HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
   New-NetFirewallRule -DisplayName "FITVA HTTP redirect" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
   ```
5. In Production the API redirects HTTP to HTTPS and sends HSTS headers.

The Android app doesn't need CORS. The website doesn't either: it calls the API from its
server (§5a), not from the browser.

## 5a. The website through the API (optional)

The Next.js site can use this API instead of reading `fitva_db` itself (`AUTH_MODE=fitva` +
`FITVA_API_URL`, see `.env.example`). Then the website and the Android app share one backend.

1. Give the API a **loopback-only** binding, so the website reaches it without going through
   the internet:
   `New-WebBinding -Name FitvaApi -Protocol http -IPAddress 127.0.0.1 -Port 5080`
2. Website environment: `AUTH_MODE=fitva` and `FITVA_API_URL=http://127.0.0.1:5080`.
   `FITVA_DATABASE_URL` / `FITVA_SESSION_SECRET` aren't needed then.
3. Requests to `127.0.0.1` / `localhost` are exempt from the HTTPS redirect. Requests on every
   other host name are still redirected.
4. The API trusts `X-Forwarded-For` only from loopback. This is why the website must use the
   loopback address: then the per-IP login limit sees each visitor's real IP, not the website
   server's.
5. Run **one** website instance (or sticky sessions). `middleware.ts` shares token refreshes
   within its process, so parallel requests don't trip the API's one-time refresh tokens.

## 6. Smoke test

From any machine:

```powershell
$api = "https://api.yourgym.in"     # or http://SERVER-IP for the test setup
Invoke-RestMethod "$api/health"
$login = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"owner@yourgym.in","password":"OWNER_LOGIN_PASSWORD"}'
Invoke-RestMethod "$api/dashboard" -Headers @{ Authorization = "Bearer $($login.accessToken)" }
```

Swagger is **off** in Production. To explore the API, run it locally in Development
(`/swagger`).

## 7. Backups (nightly)

1. Store the owner password for the backup account. As the Windows user that will run the task,
   create `%APPDATA%\postgresql\pgpass.conf` with one line:
   ```
   localhost:5432:fitva_db:fitva_owner:OWNER_PASSWORD
   ```
2. Schedule `database\deploy\backup.ps1`. It writes `D:\backups\fitva\fitva_db_<date>.dump` and keeps 14 files:
   ```powershell
   $a = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\fitva\database\deploy\backup.ps1"
   $t = New-ScheduledTaskTrigger -Daily -At 2am
   Register-ScheduledTask -TaskName "FITVA database backup" -Action $a -Trigger $t -User "$env:USERDOMAIN\$env:USERNAME" -Password "WINDOWS_PASSWORD" -RunLevel Highest
   ```
3. **Copy the backups off the server** (another machine, cloud storage). A backup on the same
   disk doesn't survive a disk failure.
4. **Test a restore** once before go-live, into a scratch database:
   ```powershell
   & $psql -U postgres -d postgres -c "create database fitva_restoretest owner fitva_owner"
   & "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe" -U fitva_owner -d fitva_restoretest D:\backups\fitva\fitva_db_<date>.dump
   ```

## 8. Updating

**API:**
1. Run `publish.ps1` on your PC.
2. On the server, put an `app_offline.htm` file in `C:\inetpub\fitva-api`. IIS then stops the app
   and shows that page.
3. Copy the new files over, but keep the `logs` folder.
4. Delete `app_offline.htm`.

**Database:**
1. Back up first: `backup.ps1`.
2. Run `run_prod.sql`, then `02_grants.sql`, both as `fitva_owner`.

`run_prod.sql` recreates views and functions, but it **doesn't change existing tables**
(`create table if not exists`). A column change needs its own `ALTER TABLE` script.

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| HTTP 500.19 | Hosting Bundle missing or installed before IIS. Reinstall it and restart IIS. |
| HTTP 500.30 / 500.31 | The app failed at startup, usually a missing `ConnectionStrings__Fitva` or `Jwt__Key` (§4). To see why, temporarily set `stdoutLogEnabled="true"` in `web.config` and read `logs\stdout_*.log`. |
| `/health` → 503 `database: unreachable` | PostgreSQL stopped, wrong app password, or a `pg_hba.conf` line missing (§2). |
| Login always 401 | Wrong email or password, the login is inactive, or the gym wasn't created (§3 step 4). |
| 429 Too Many Requests | The rate limit: 5 logins per minute per IP, 300 requests per minute per user. Adjust `RateLimits` in `appsettings.Production.json` if needed. |
| App logs | `C:\inetpub\fitva-api\logs\fitva-YYYYMMDD.log` (14 days kept) |
