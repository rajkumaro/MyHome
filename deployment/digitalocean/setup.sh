#!/usr/bin/env bash
# =============================================================================
# DigitalOcean Droplet Setup Script for MyHome
# =============================================================================
# Run this script on a fresh Ubuntu 22.04 droplet.
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="/opt/myhome"
REPO_URL="https://github.com/rajkumaro/MyHome.git"
LOG_FILE="/var/log/myhome-setup.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# ── System updates ─────────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban

# ── Firewall ───────────────────────────────────────────────────────────────────
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── Docker ─────────────────────────────────────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl start docker
  systemctl enable docker
  usermod -aG docker "$SUDO_USER"
fi

# ── Docker Compose ─────────────────────────────────────────────────────────────
log "Installing Docker Compose..."
if ! command -v docker-compose &>/dev/null; then
  COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
  curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  chmod +x /usr/local/bin/docker-compose
fi

# ── Certbot / Let's Encrypt ────────────────────────────────────────────────────
if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
  log "Setting up SSL with Let's Encrypt for domain: $DOMAIN"
  apt-get install -y certbot python3-certbot-nginx
  certbot certonly --standalone --non-interactive --agree-tos \
    --email "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN"

  # Renew cron
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker restart myhome-nginx-proxy") | crontab -
  log "SSL certificate obtained for $DOMAIN"
fi

# ── Clone repository ───────────────────────────────────────────────────────────
log "Cloning repository..."
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── Create nginx proxy config ──────────────────────────────────────────────────
if [ -n "$DOMAIN" ]; then
  cat > "$APP_DIR/deployment/digitalocean/nginx-proxy.conf" << NGINX_EOF
server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
NGINX_EOF
fi

# ── Set up environment file ────────────────────────────────────────────────────
log "Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/env/.env.production" "$APP_DIR/.env"
  log "⚠️  Edit $APP_DIR/.env with your actual credentials before starting."
fi

# ── Set up systemd service ─────────────────────────────────────────────────────
log "Creating systemd service..."
cat > /etc/systemd/system/myhome.service << 'SERVICE'
[Unit]
Description=MyHome Application (Docker Compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/myhome
ExecStart=/usr/local/bin/docker-compose -f deployment/digitalocean/docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deployment/digitalocean/docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable myhome

log "✅ Setup complete!"
log "Next steps:"
log "  1. Edit /opt/myhome/.env with your credentials"
log "  2. Start: sudo systemctl start myhome"
log "  3. Logs:  docker-compose -f /opt/myhome/deployment/digitalocean/docker-compose.prod.yml logs -f"
