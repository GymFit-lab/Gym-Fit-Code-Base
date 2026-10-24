# Builds the API for the server: a Release build in backend/publish/FitvaApi, ready to copy to
# the IIS site folder (backend/DEPLOY.md §4). Framework-dependent: the server needs the
# ASP.NET Core 10 Hosting Bundle. Usage:  powershell -File backend/deploy/publish.ps1
param([string]$Output = (Join-Path $PSScriptRoot "..\publish\FitvaApi"))
$ErrorActionPreference = "Stop"
$env:DOTNET_CLI_TELEMETRY_OPTOUT = "1"; $env:DOTNET_NOLOGO = "1"

$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
$dotnet = if ($dotnet) { $dotnet.Source } else { "C:\Program Files\dotnet\dotnet.exe" }
$project = Join-Path $PSScriptRoot "..\src\FitvaApi\FitvaApi.csproj"

if (Test-Path $Output) { Remove-Item $Output -Recurse -Force }
& $dotnet publish $project -c Release -o $Output
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }

# Development-only settings don't belong on the server.
Remove-Item (Join-Path $Output "appsettings.Development.json") -ErrorAction SilentlyContinue

$size = (Get-ChildItem $Output -Recurse | Measure-Object Length -Sum).Sum / 1MB
"Published to $((Resolve-Path $Output).Path) ({0:N1} MB). Copy this folder to the server." -f $size
