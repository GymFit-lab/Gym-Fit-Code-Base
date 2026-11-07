#!/usr/bin/env bash
# Installs one release on the server. Called by deploy.ps1 (from your PC) — not run by hand.
#   sudo bash release.sh <api.tar.gz> <web.tar.gz>
# 1. database: create logins/database if missing, apply run_prod.sql + grants (re-runnable)
# 2. API: unpack the published build
# 3. website: unpack the source, pnpm install + build ON the server (native packages need Linux)
# 4. switch both to the new release, restart, health-check — and roll back if a check fails.
set -euo pipefail

API_TGZ="$1"
WEB_TGZ="$2"
STAMP="$(date +%Y%m%d-%H%M%S)"
KEEP=3
log() { echo -e "\n== $*"; }

[[ $EUID -eq 0 ]] || { echo "Run as root"; exit 1; }
# shellcheck disable=SC1091
source /etc/fitva/secrets.env

API_DIR="/opt/fitva/api/releases/$STAMP"
WEB_DIR="/opt/fitva/web/releases/$STAMP"

log "Unpacking release $STAMP"
mkdir -p "$API_DIR" "$WEB_DIR"
tar -xzf "$API_TGZ" -C "$API_DIR"
tar -xzf "$WEB_TGZ" -C "$WEB_DIR"
chown -R fitva:fitva "$API_DIR" "$WEB_DIR"

log "Database"
psql_owner() { PGPASSWORD="$DB_OWNER_PASSWORD" psql -h 127.0.0.1 -U fitva_owner -d fitva_db -X -q -v ON_ERROR_STOP=1 "$@"; }
# Logins + database (idempotent; re-applies the same passwords).
sudo -u postgres psql -d postgres -X -q -v ON_ERROR_STOP=1 \
  -v owner_password="$DB_OWNER_PASSWORD" -v app_password="$DB_APP_PASSWORD" \
  -f "$WEB_DIR/database/deploy/01_create_roles_and_db.sql"
psql_owner -f "$WEB_DIR/database/run_prod.sql"
psql_owner -f "$WEB_DIR/database/deploy/02_grants.sql"

log "Website build (pnpm install + next build)"
sudo -u fitva -H bash -c "
  set -euo pipefail
  cd '$WEB_DIR'
  set -a; source /etc/fitva/web.env; set +a
  export NODE_ENV=development   # install devDependencies (TypeScript, Tailwind) needed by the build
  pnpm config set store-dir /opt/fitva/.pnpm-store >/dev/null
  pnpm install --frozen-lockfile
  export NODE_ENV=production
  export NODE_OPTIONS=\"--max-old-space-size=1536\${NODE_OPTIONS:+ \$NODE_OPTIONS}\"
  pnpm build
"

PREV_API="$(readlink -f /opt/fitva/api/current || true)"
PREV_WEB="$(readlink -f /opt/fitva/web/current || true)"

log "Switching to $STAMP"
ln -sfn "$API_DIR" /opt/fitva/api/current
ln -sfn "$WEB_DIR" /opt/fitva/web/current
systemctl restart fitva-api
systemctl restart fitva-web

wait_for() { # url, label
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "$1"; then echo "$2: OK"; return 0; fi
    sleep 2
  done
  echo "$2: FAILED"; return 1
}

if wait_for http://127.0.0.1:5000/health "API /health" && wait_for http://127.0.0.1:3000/ "Website"; then
  log "Release $STAMP is live"
else
  log "Health check failed — rolling back"
  journalctl -u fitva-api -u fitva-web -n 40 --no-pager || true
  if [[ -n "$PREV_API" && -n "$PREV_WEB" ]]; then
    ln -sfn "$PREV_API" /opt/fitva/api/current
    ln -sfn "$PREV_WEB" /opt/fitva/web/current
    systemctl restart fitva-api fitva-web
    echo "Rolled back to $(basename "$PREV_WEB")"
  fi
  exit 1
fi

log "Cleaning up (keeping the last $KEEP releases)"
for d in /opt/fitva/api/releases /opt/fitva/web/releases; do
  ls -1dt "$d"/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
done
rm -f "$API_TGZ" "$WEB_TGZ"
