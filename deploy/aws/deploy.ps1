# FITVA - deploy to the AWS EC2 server from this PC (Windows PowerShell 5.1 or 7).
#
#   One-time server setup:  .\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem -Setup
#   Deploy a release:       .\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem
#   Turn on HTTPS (once):   .\deploy\aws\deploy.ps1 -Server <ELASTIC_IP> -Key C:\keys\fitva.pem -Https -Email you@example.com
#
# A release ships the LAST COMMIT (HEAD) of the website and database scripts, plus a fresh
# Release build of the .NET API. The server builds the website itself and switches over only
# when both health checks pass (otherwise it rolls back). See DEPLOY-AWS.md.
param(
    [Parameter(Mandatory = $true)] [string]$Server,
    [Parameter(Mandatory = $true)] [string]$Key,
    [string]$User = "ubuntu",
    [string]$Domain = "fitva.co.in",
    [switch]$Setup,
    [switch]$Https,
    [string]$Email
)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $root

if (-not (Test-Path $Key)) { throw "Key file not found: $Key" }
$target = "$User@$Server"
$sshOpts = @("-i", $Key, "-o", "StrictHostKeyChecking=accept-new", "-o", "ServerAliveInterval=30")

function Remote([string]$command) {
    & ssh @sshOpts $target $command
    if ($LASTEXITCODE -ne 0) { throw "Remote command failed (exit $LASTEXITCODE): $command" }
}
function Upload([string[]]$files, [string]$dest) {
    & scp @sshOpts @files "${target}:$dest"
    if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
}

if ($Setup) {
    Write-Host "== Uploading setup files to $Server"
    Remote "rm -rf /tmp/fitva-setup && mkdir -p /tmp/fitva-setup"
    Upload (Get-ChildItem deploy\aws -File | Where-Object { $_.Extension -in ".sh", ".service", ".conf" } | ForEach-Object FullName) "/tmp/fitva-setup/"
    Write-Host "== Running setup-server.sh (takes 5-10 minutes)"
    # Strip any Windows line endings from a Windows checkout before bash reads the files.
    Remote "sed -i 's/\r$//' /tmp/fitva-setup/* && sudo DOMAIN=$Domain bash /tmp/fitva-setup/setup-server.sh"
    Write-Host "`nServer is set up. Next: deploy the first release (same command without -Setup)."
    exit 0
}

if ($Https) {
    if (-not $Email) { throw "-Https needs -Email (Let's Encrypt sends certificate expiry notices there)" }
    Write-Host "== Requesting HTTPS certificates for $Domain, www.$Domain, api.$Domain"
    Remote "sudo certbot --nginx -d $Domain -d www.$Domain -d api.$Domain --redirect --agree-tos -m $Email -n"
    Write-Host "`nHTTPS is on: https://$Domain and https://api.$Domain (renews automatically)."
    exit 0
}

# ---------------------------------------------------------------- release
if (git status --porcelain) {
    Write-Warning "You have uncommitted changes. Only the last commit is deployed for the website; the API is built from your working copy."
}
$commit = (git rev-parse --short HEAD).Trim()
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $env:TEMP "fitva-deploy-$stamp"
New-Item -ItemType Directory -Force $out | Out-Null

Write-Host "== Building the API (Release)"
& powershell -NoProfile -ExecutionPolicy Bypass -File backend\deploy\publish.ps1 -Output (Join-Path $out "api")
if ($LASTEXITCODE -ne 0) { throw "API build failed" }
& tar -czf (Join-Path $out "api.tar.gz") -C (Join-Path $out "api") .
if ($LASTEXITCODE -ne 0) { throw "Packing the API failed" }

Write-Host "== Packing website + database scripts from commit $commit"
# autocrlf=false: ship the repository's LF line endings (bash and psql on Linux break on CRLF).
& git -c core.autocrlf=false archive --format=tar.gz -o (Join-Path $out "web.tar.gz") HEAD -- . ":(exclude)backend"
if ($LASTEXITCODE -ne 0) { throw "git archive failed" }

Write-Host "== Uploading"
Remote "rm -rf /tmp/fitva-release && mkdir -p /tmp/fitva-release"
Upload @((Join-Path $out "api.tar.gz"), (Join-Path $out "web.tar.gz")) "/tmp/fitva-release/"

Write-Host "== Installing on the server (database update, website build, switch-over; 3-6 minutes)"
Remote "cd /tmp/fitva-release && tar -xzf web.tar.gz deploy/aws/release.sh && sudo bash deploy/aws/release.sh /tmp/fitva-release/api.tar.gz /tmp/fitva-release/web.tar.gz"

Remove-Item $out -Recurse -Force
Write-Host "`nDeployed commit $commit. Website: https://$Domain   API: https://api.$Domain/health"
