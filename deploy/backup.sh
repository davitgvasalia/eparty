#!/usr/bin/env bash
# Daily backup of the database and the ID photo folder; keeps the last 14 days.
# Installed by setup-server.sh as a cron job (03:00). Run manually as root to test.
set -euo pipefail

BACKUP_DIR=/srv/eparty/backups
STORAGE_DIR=/srv/eparty/storage
KEEP_DAYS=14
STAMP=$(date +%Y-%m-%d_%H%M)

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

sudo -u postgres pg_dump -Fc eparty > "$BACKUP_DIR/db-$STAMP.dump"
tar -czf "$BACKUP_DIR/storage-$STAMP.tar.gz" -C "$STORAGE_DIR" .

find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete
echo "Backup written: $BACKUP_DIR/db-$STAMP.dump, storage-$STAMP.tar.gz"
