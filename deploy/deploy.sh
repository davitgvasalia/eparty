#!/usr/bin/env bash
# Pulls the latest code, builds it, applies database migrations and restarts the app.
# Run on the server as root:  sudo /srv/eparty/app/deploy/deploy.sh
set -euo pipefail

APP_DIR=/srv/eparty/app
as_app() { sudo -u eparty -H bash -c "cd '$APP_DIR' && $1"; }

echo "==> Pulling latest code"
as_app "git pull --ff-only"

echo "==> Installing dependencies"
as_app "npm ci --no-audit --no-fund"

echo "==> Building"
as_app "npm run build"

echo "==> Applying database migrations"
as_app "npx prisma migrate deploy"

echo "==> Restarting"
systemctl restart eparty
sleep 3
if systemctl is-active --quiet eparty && curl -fsS -o /dev/null http://127.0.0.1:3000/api/state; then
  echo "==> Done: the app is running."
else
  echo "!! The app did not come up. Check: journalctl -u eparty -n 50" >&2
  exit 1
fi
