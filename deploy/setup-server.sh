#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 VPS for E-Party.
#
# Usage (as root):
#   bash setup-server.sh <domain> <email> <git-repo-url> <admin-wallet>
# Example:
#   bash setup-server.sh eparty.ge me@example.com git@github.com:me/eparty.git 4aTU...yfp8
#
# The domain's A record must already point at this server (needed for the HTTPS certificate).
# Safe to re-run: existing database, .env and photos are kept.
set -euo pipefail

if [[ $# -ne 4 ]]; then
  sed -n '2,9p' "$0"
  exit 1
fi
DOMAIN=$1
EMAIL=$2
REPO=$3
ADMIN_WALLET=$4

BASE=/srv/eparty
APP_DIR=$BASE/app
STORAGE_DIR=$BASE/storage/ids

[[ $EUID -eq 0 ]] || { echo "Run as root" >&2; exit 1; }

echo "==> System packages"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y curl git nginx postgresql ufw certbot python3-certbot-nginx

echo "==> Node.js 22 LTS"
if ! command -v node >/dev/null || [[ $(node -v) != v22.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Swap (the build needs more memory than small VPS plans have)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Firewall: SSH and web only"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> App user and folders"
id eparty >/dev/null 2>&1 || useradd --system --create-home --home-dir "$BASE" --shell /bin/bash eparty
mkdir -p "$STORAGE_DIR"
chown -R eparty:eparty "$BASE"
chmod 700 "$BASE/storage" "$STORAGE_DIR"

echo "==> Code"
if [[ ! -d $APP_DIR/.git ]]; then
  # A private repository needs the eparty user's SSH key added as a deploy key (see deploy/README.md).
  sudo -u eparty -H git clone "$REPO" "$APP_DIR"
fi

echo "==> Database"
DB_PASS_FILE=$BASE/.db-password
if [[ ! -f $DB_PASS_FILE ]]; then
  openssl rand -hex 24 > "$DB_PASS_FILE"
  chown eparty:eparty "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
fi
DB_PASS=$(cat "$DB_PASS_FILE")
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'eparty') THEN
    CREATE ROLE eparty LOGIN PASSWORD '$DB_PASS';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'eparty'" | grep -q 1 \
  || sudo -u postgres createdb -O eparty eparty

echo "==> Environment (.env)"
ENV_FILE=$APP_DIR/.env
if [[ ! -f $ENV_FILE ]]; then
  cat > "$ENV_FILE" <<ENV
DATABASE_URL="postgresql://eparty:$DB_PASS@localhost:5432/eparty?schema=public"
SESSION_SECRET="$(openssl rand -hex 32)"
NEXT_PUBLIC_ADMIN_WALLET=$ADMIN_WALLET
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
ID_PHOTO_DIR=$STORAGE_DIR
ENV
  chown eparty:eparty "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

echo "==> systemd service"
cp "$APP_DIR/deploy/eparty.service" /etc/systemd/system/eparty.service
systemctl daemon-reload
systemctl enable eparty

echo "==> First build and migrations"
bash "$APP_DIR/deploy/deploy.sh"

echo "==> Districts (no demo data)"
sudo -u eparty -H bash -c "cd '$APP_DIR' && SEED_DEMO=false npm run db:seed"

echo "==> nginx"
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/eparty
ln -sf /etc/nginx/sites-available/eparty /etc/nginx/sites-enabled/eparty
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> HTTPS certificate"
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -m "$EMAIL" --agree-tos -n --redirect

echo "==> Daily backup (03:00)"
chmod +x "$APP_DIR/deploy/"*.sh
echo "0 3 * * * root $APP_DIR/deploy/backup.sh >> /var/log/eparty-backup.log 2>&1" > /etc/cron.d/eparty-backup

echo
echo "Done. Open https://$DOMAIN and sign in with the administrator wallet."
