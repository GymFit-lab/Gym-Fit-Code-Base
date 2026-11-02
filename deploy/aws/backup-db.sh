#!/usr/bin/env bash
# Nightly fitva_db backup (custom format, restore with pg_restore). Keeps the newest 14.
# Installed by setup-server.sh as /usr/local/bin/fitva-backup-db, run by /etc/cron.d/fitva-backup.
set -euo pipefail
DIR=/var/backups/fitva
FILE="$DIR/fitva_db_$(date +%Y-%m-%d_%H%M).dump"

sudo -u postgres pg_dump -Fc fitva_db -f "$FILE"
ls -1t "$DIR"/fitva_db_*.dump | tail -n +15 | xargs -r rm -f
echo "$(date -Is) backup written: $FILE ($(du -h "$FILE" | cut -f1))"
