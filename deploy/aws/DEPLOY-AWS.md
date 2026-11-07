# Deploying FITVA on AWS EC2

Everything runs on one Ubuntu server in Mumbai: Nginx in front, the Next.js website, the .NET API
and PostgreSQL. You click through the AWS console and GoDaddy once; after that, every deploy is
one command from your PC.

```
https://fitva.co.in      ─┐                     ┌─► website  (Next.js, 127.0.0.1:3000)
https://www.fitva.co.in  ─┼─► Nginx + HTTPS ────┤
https://api.fitva.co.in  ─┘   (Let's Encrypt)   └─► .NET API (127.0.0.1:5000) ─► PostgreSQL (localhost only)
```

| Item     | Choice                                                                                    | Cost (approx.) |
| -------- | ----------------------------------------------------------------------------------------- | -------------- |
| Server   | EC2 **t3.small** (2 vCPU, 2 GB RAM), **Ubuntu 26.04 LTS**, region **Mumbai (ap-south-1)** | ~$16/month     |
| Disk     | 30 GB gp3                                                                                 | ~$3/month      |
| Fixed IP | Elastic IP (public IPv4)                                                                  | ~$4/month      |
| HTTPS    | Let's Encrypt                                                                             | free           |

Files in this folder: `setup-server.sh` (one-time server setup), `release.sh` (installs a
release on the server), `deploy.ps1` (what you run on your PC), `create-first-gym.sh`,
`backup-db.sh`, the two systemd services, and the Nginx config.

---

## 1. AWS console (about 15 minutes, once)

Sign in at <https://console.aws.amazon.com>. In the top-right region menu, choose **Asia Pacific (Mumbai)**.

**1.1 Key pair** (your SSH key)

1. Go to **EC2** → **Key pairs** → **Create key pair**.
2. Name: `fitva`. Type: **RSA**. Format: **.pem**. Then click **Create**.
3. The file downloads. Move it to `C:\keys\fitva.pem`. **Keep it safe:** whoever has it can log in to the server.

**1.2 Launch the server**

1. Go to **EC2** → **Instances** → **Launch instances**.
2. Name: `fitva-prod`.
3. Image: **Ubuntu Server 26.04 LTS (HVM), SSD Volume Type**, architecture **64-bit (x86)**.
4. Instance type: **t3.small**.
5. Key pair: **fitva**.
6. **Network settings** → **Edit**:
   - **Allow SSH traffic from:** **My IP** (only your PC can log in).
   - Tick **Allow HTTPS traffic from the internet**.
   - Tick **Allow HTTP traffic from the internet**.
7. **Configure storage:** **30** GiB, **gp3**.
8. Click **Launch instance**.

**1.3 Fixed IP address (Elastic IP)**

1. Go to **EC2** → **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
2. Select the new IP → **Actions** → **Associate Elastic IP address**.
3. Instance: `fitva-prod`. Click **Associate**.
4. **Note this IP**. It's called `<ELASTIC_IP>` below.

**1.4 (Recommended) Billing alert**

1. Go to **Billing** → **Budgets** → **Create budget**.
2. Choose a monthly cost budget, e.g. $30, with an email alert.

## 2. GoDaddy DNS (5 minutes, then up to 1 hour to take effect)

1. Go to <https://dcc.godaddy.com> → **Domains** → `fitva.co.in` → **DNS** (or **Manage DNS**).
2. Set up these records:

| Type  | Name  | Value                  | TTL         |
| ----- | ----- | ---------------------- | ----------- |
| A     | `@`   | `<ELASTIC_IP>`         | 600 seconds |
| A     | `api` | `<ELASTIC_IP>`         | 600 seconds |
| CNAME | `www` | `@` (or `fitva.co.in`) | 1 hour      |

- **Edit** the existing `A @` record ("Parked") instead of adding a second one.
- The `www` CNAME usually exists already. If not, add it.
- Delete any other `A @` record or "Forwarding" rule, so they don't fight with the server.

3. Check it on your PC. Both should show `<ELASTIC_IP>`:
   ```powershell
   nslookup fitva.co.in
   nslookup api.fitva.co.in
   ```

## 3. Your PC (once)

The SSH key must be readable only by you, or Windows' `ssh` refuses it:

```powershell
icacls C:\keys\fitva.pem /inheritance:r
icacls C:\keys\fitva.pem /grant:r "$($env:USERNAME):(R)"
ssh -i C:\keys\fitva.pem ubuntu@<ELASTIC_IP> "echo connected"   # answer 'yes' the first time
```

## 4. Set up the server (once, 5–10 minutes)

From the project folder (`D:\GymFit_CL`):

```powershell
.\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem -Setup
```

This installs:

- Nginx, PostgreSQL 18, the .NET 10 runtime, Node.js 24 and pnpm 10.
- A 2 GB swap file.
- The `fitva` system user and the two services.
- Firewall rules: SSH, HTTP and HTTPS only. PostgreSQL listens on localhost only.
- Nightly database backups (02:30) and automatic security updates.

It also **generates the secrets** (database passwords, JWT key) into `/etc/fitva/secrets.env` on
the server. They never leave the server and are never in git.

## 5. First release (3–6 minutes)

Deploys the **last commit** of the current branch:

```powershell
.\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem
```

What it does:

1. Builds the API on your PC.
2. Packs the website and database scripts from git.
3. Uploads both. On the server it then:
   - creates or updates the database (`run_prod.sql`, **no demo data**) and its rights;
   - builds the website;
   - switches over;
   - checks `/health` and the home page. **If a check fails, it rolls back** to the previous release automatically.

## 6. HTTPS (once, after DNS from step 2 works)

```powershell
.\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem -Https -Email you@example.com
```

This gets free Let's Encrypt certificates for all three addresses and redirects HTTP to HTTPS.
Certificates **renew automatically**.

**Logging in only works after this step.** The login cookies are HTTPS-only in production.

## 7. Create your gym and owner login (once)

```powershell
ssh -i C:\keys\fitva.pem ubuntu@<ELASTIC_IP>
sudo bash /opt/fitva/web/current/deploy/aws/create-first-gym.sh
```

It asks for the gym name, the branch, and the owner's name, email and password. Then log in at
**https://fitva.co.in/login**. The owner adds staff logins from there (or with the API's `/staff`).

### Optional: demo data (for sales demos)

To fill a new gym with sample clients, plans, memberships, payments and check-ins (re-runnable, and
it only touches the demo rows it creates):

```bash
ssh -i C:\keys\fitva.pem ubuntu@<ELASTIC_IP>
sudo -i
set -a; . /etc/fitva/secrets.env; set +a
PGPASSWORD="$DB_OWNER_PASSWORD" psql -h 127.0.0.1 -U fitva_owner -d fitva_db \
  -v ON_ERROR_STOP=1 -v owner_email='owner@example.in' \
  -f /opt/fitva/web/current/database/deploy/05_demo_data.sql
```

Use the owner login's email. It creates no extra logins — the sample trainers are records only.

## 8. Check it

- **https://fitva.co.in**: the home page with the FITVA logo, padlock in the address bar.
- **https://fitva.co.in/login**: log in as the owner, then open the dashboard and the gym pages.
- **https://api.fitva.co.in/health** → `{"status":"ok","database":"ok"}`.
- **The Android app** uses the base URL `https://api.fitva.co.in` (see `backend/API.md`).

---

## Everyday tasks

| Task                 | How                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deploy an update** | Commit, then run `.\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem`. The site stays up while the new release builds.                                     |
| See app logs         | `ssh …` then `sudo journalctl -u fitva-web -n 100` or `-u fitva-api`. API files: `/var/log/fitva/api/`                                                                      |
| Restart              | `sudo systemctl restart fitva-api fitva-web`                                                                                                                                |
| Backups              | `/var/backups/fitva/` (14 nightly files). **Copy them off the server regularly**, e.g. `scp -i C:\keys\fitva.pem ubuntu@<ELASTIC_IP>:/var/backups/fitva/*.dump D:\backups\` |
| Restore a backup     | `sudo -u postgres pg_restore --clean --if-exists -d fitva_db /var/backups/fitva/<file>.dump`, then `sudo systemctl restart fitva-api`                                       |
| Whole-server backup  | EC2 → **Lifecycle Manager** → create a policy for daily EBS snapshots of `fitva-prod`, kept 7 days (about $1–2/month)                                                       |
| Bigger server later  | EC2 → Stop instance → **Change instance type** (e.g. `t3.medium`) → Start. The Elastic IP stays.                                                                            |

## Troubleshooting

| Problem                                          | Fix                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `ssh`: "UNPROTECTED PRIVATE KEY FILE"            | Run the two `icacls` commands in step 3                                                                        |
| `ssh` times out                                  | Your home IP changed. EC2 → Security groups → edit the SSH rule → **My IP**                                    |
| certbot: "DNS problem" / "connection refused"    | DNS isn't pointing at the Elastic IP yet (check with `nslookup`), or port 80 is closed in the security group   |
| Deploy says "Health check failed — rolling back" | The output shows the last log lines. The old release keeps running. Fix the problem, commit, and deploy again. |
| Website shows "Can't reach the gym database"     | `sudo systemctl status fitva-api`, then `sudo journalctl -u fitva-api -n 50`                                   |
| Build runs out of memory                         | The 2 GB swap should prevent it. Otherwise move to `t3.medium` (see above).                                    |
