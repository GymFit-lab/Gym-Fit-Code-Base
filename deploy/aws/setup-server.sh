#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 26.04 EC2 server for FITVA (website + .NET API + PostgreSQL).
# (On 26.04 the default PostgreSQL is 18 and its contrib modules ship inside postgresql-18.)
# Run once, as root:   sudo bash setup-server.sh
# Safe to run again: it skips what already exists and never overwrites secrets.
set -euo pipefail

DOMAIN="${DOMAIN:-fitva.co.in}"
API_DOMAIN="api.${DOMAIN}"
NODE_MAJOR=24
PNPM_VERSION=10
DOTNET_CHANNEL=10.0

[[ $EUID -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }
export DEBIAN_FRONTEND=noninteractive
log() { echo -e "\n== $*"; }

log "System packages"
apt-get update -y
apt-get upgrade -y
# postgresql-contrib is not a package on 26.04: postgresql-18 already ships pgcrypto + citext.
apt-get install -y nginx postgresql certbot python3-certbot-nginx \
  curl ca-certificates gnupg ufw openssl unattended-upgrades

log "Swap (2 GB) so the website build fits on a 2 GB server"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

log "Node.js ${NODE_MAJOR} + pnpm ${PNPM_VERSION}"
if ! command -v node >/dev/null || [[ "$(node -v)" != v${NODE_MAJOR}.* ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
npm install -g "pnpm@${PNPM_VERSION}"

log ".NET ${DOTNET_CHANNEL} ASP.NET Core runtime"
if ! /usr/share/dotnet/dotnet --list-runtimes 2>/dev/null | grep -q "Microsoft.AspNetCore.App ${DOTNET_CHANNEL}"; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel "${DOTNET_CHANNEL}" --runtime aspnetcore --install-dir /usr/share/dotnet
  ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet
fi

log "App user and folders"
id fitva >/dev/null 2>&1 || useradd --system --home-dir /opt/fitva --shell /usr/sbin/nologin fitva
mkdir -p /opt/fitva/api/releases /opt/fitva/web/releases /opt/fitva/.pnpm-store /etc/fitva \
  /var/log/fitva/api /var/backups/fitva
chown -R fitva:fitva /opt/fitva /var/log/fitva
chmod 755 /opt/fitva
chown root:fitva /etc/fitva && chmod 750 /etc/fitva
chown postgres:postgres /var/backups/fitva && chmod 700 /var/backups/fitva

log "Secrets (generated once, kept in /etc/fitva, never in git)"
if [[ ! -f /etc/fitva/secrets.env ]]; then
  cat > /etc/fitva/secrets.env <<EOF
DB_OWNER_PASSWORD=$(openssl rand -hex 24)
DB_APP_PASSWORD=$(openssl rand -hex 24)
JWT_KEY=$(openssl rand -base64 64 | tr -d '\n')
BETTER_AUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
EOF
  chmod 600 /etc/fitva/secrets.env
fi
# shellcheck disable=SC1091
source /etc/fitva/secrets.env

cat > /etc/fitva/api.env <<EOF
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://127.0.0.1:5000
ConnectionStrings__Fitva=Host=127.0.0.1;Port=5432;Database=fitva_db;Username=fitva_app;Password=${DB_APP_PASSWORD}
Jwt__Key=${JWT_KEY}
Serilog__FilePath=/var/log/fitva/api/fitva-.log
DOTNET_CLI_TELEMETRY_OPTOUT=1
EOF

cat > /etc/fitva/web.env <<EOF
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000
HOSTNAME=127.0.0.1
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
# Not used in fitva mode, but lib/db.ts builds PrismaPg at import time during the Next build.
DATABASE_URL=postgresql://fitva_app:${DB_APP_PASSWORD}@127.0.0.1:5432/fitva_db
AUTH_MODE=fitva
FITVA_API_URL=http://127.0.0.1:5000
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=https://${DOMAIN}
EOF
chown root:fitva /etc/fitva/api.env /etc/fitva/web.env
chmod 640 /etc/fitva/api.env /etc/fitva/web.env

log "PostgreSQL: local connections only"
PG_CONF=$(ls /etc/postgresql/*/main/postgresql.conf | head -1)
sed -i "s/^#\?listen_addresses.*/listen_addresses = 'localhost'/" "$PG_CONF"
systemctl enable --now postgresql
systemctl restart postgresql

log "Services"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
install -m 644 "$SRC_DIR/fitva-api.service" /etc/systemd/system/fitva-api.service
install -m 644 "$SRC_DIR/fitva-web.service" /etc/systemd/system/fitva-web.service
systemctl daemon-reload
systemctl enable fitva-api fitva-web

log "Nginx for ${DOMAIN}, www.${DOMAIN} and ${API_DOMAIN}"
sed "s/__DOMAIN__/${DOMAIN}/g" "$SRC_DIR/nginx-fitva.conf" > /etc/nginx/sites-available/fitva
ln -sf /etc/nginx/sites-available/fitva /etc/nginx/sites-enabled/fitva
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Firewall (SSH + HTTP/HTTPS only)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

log "Nightly database backup (02:30, keeps 14)"
install -m 755 "$SRC_DIR/backup-db.sh" /usr/local/bin/fitva-backup-db
echo "30 2 * * * root /usr/local/bin/fitva-backup-db >> /var/log/fitva/backup.log 2>&1" > /etc/cron.d/fitva-backup
chmod 644 /etc/cron.d/fitva-backup

log "Automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo
echo "Done. Next: run deploy/aws/deploy.ps1 on your PC for the first release (see DEPLOY-AWS.md)."
