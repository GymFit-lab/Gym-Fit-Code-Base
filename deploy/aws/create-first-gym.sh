#!/usr/bin/env bash
# Creates your gym and its owner login (a production database has no demo data). Run once on the
# server after the first deploy:   sudo bash /opt/fitva/web/current/deploy/aws/create-first-gym.sh
# More staff logins can then be added in the app (owner → /staff) or the API.
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }
# shellcheck disable=SC1091
source /etc/fitva/secrets.env

read -rp "Gym name: " GYM_NAME
read -rp "Branch / area (e.g. Baner, Pune): " GYM_BRANCH
read -rp "Owner's full name: " OWNER_NAME
read -rp "Owner's login email: " OWNER_EMAIL
read -rsp "Owner's password (min 8 characters): " OWNER_PASSWORD; echo
[[ ${#OWNER_PASSWORD} -ge 8 ]] || { echo "Password too short."; exit 1; }

PGPASSWORD="$DB_OWNER_PASSWORD" psql -h 127.0.0.1 -U fitva_owner -d fitva_db -X -v ON_ERROR_STOP=1 \
  -v gym_name="$GYM_NAME" -v gym_branch="$GYM_BRANCH" -v owner_name="$OWNER_NAME" \
  -v owner_email="$OWNER_EMAIL" -v owner_password="$OWNER_PASSWORD" \
  -f /opt/fitva/web/current/database/deploy/03_first_gym.sql

echo "Done. Log in at https://$(grep -oP '(?<=NEXT_PUBLIC_SITE_URL=https://).*' /etc/fitva/web.env)/login with $OWNER_EMAIL"
