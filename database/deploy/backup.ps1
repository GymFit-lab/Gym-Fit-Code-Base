# Nightly backup of fitva_db (custom format, restorable with pg_restore). Keeps the newest $Keep files.
# Schedule it with Task Scheduler (see backend/DEPLOY.md §7). The password comes from the pgpass file
# of the account running the task (%APPDATA%\postgresql\pgpass.conf), never from this script.
param(
    [string]$BackupDir = "D:\backups\fitva",
    [int]$Keep = 14,
    [string]$PgBin = "C:\Program Files\PostgreSQL\16\bin",
    [string]$Database = "fitva_db",
    [string]$User = "fitva_owner"
)
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force $BackupDir | Out-Null
$file = Join-Path $BackupDir ("{0}_{1}.dump" -f $Database, (Get-Date -Format "yyyy-MM-dd_HHmm"))

& "$PgBin\pg_dump.exe" -U $User -h localhost -d $Database -Fc -w -f $file
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }

Get-ChildItem $BackupDir -Filter "${Database}_*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $Keep |
    Remove-Item -Force

"Backup written: $file ($([int]((Get-Item $file).Length / 1KB)) KB)"
