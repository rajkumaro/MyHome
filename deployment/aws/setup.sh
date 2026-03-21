#!/usr/bin/env bash
# =============================================================================
# AWS EC2 Setup Script for MyHome
# =============================================================================
# Run this script on a fresh Amazon Linux 2023 EC2 instance to set up
# the MyHome application.
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh
# =============================================================================
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
APP_DIR="/opt/myhome"
REPO_URL="https://github.com/rajkumaro/MyHome.git"
LOG_FILE="/var/log/myhome-setup.log"

# ── Logging ────────────────────────────────────────────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# ── System updates ─────────────────────────────────────────────────────────────
log "Updating system packages..."
yum update -y

# ── Install Docker ─────────────────────────────────────────────────────────────
log "Installing Docker..."
yum install -y docker git curl
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# ── Install Docker Compose ─────────────────────────────────────────────────────
log "Installing Docker Compose..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
log "Docker Compose version: $(docker-compose --version)"

# ── Install Nginx ──────────────────────────────────────────────────────────────
log "Installing Nginx..."
yum install -y nginx
systemctl enable nginx

# ── Clone repository ───────────────────────────────────────────────────────────
log "Cloning repository..."
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R ec2-user:ec2-user "$APP_DIR"

# ── Set up environment file ────────────────────────────────────────────────────
log "Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/env/.env.production" "$APP_DIR/.env"
  log "⚠️  Please edit $APP_DIR/.env with your actual credentials before starting the app."
fi

# ── Configure Nginx reverse proxy ─────────────────────────────────────────────
log "Configuring Nginx reverse proxy..."
cat > /etc/nginx/conf.d/myhome.conf << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_CONF

nginx -t && systemctl restart nginx

# ── Set up systemd service ─────────────────────────────────────────────────────
log "Creating systemd service..."
cat > /etc/systemd/system/myhome.service << 'SERVICE'
[Unit]
Description=MyHome Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/myhome
ExecStart=/usr/local/bin/docker-compose -f docker/docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker/docker-compose.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable myhome

log "✅ Setup complete!"
log "Next steps:"
log "  1. Edit /opt/myhome/.env with your actual credentials"
log "  2. Run: sudo systemctl start myhome"
log "  3. Check status: sudo systemctl status myhome"
log "  4. View logs: docker-compose -f /opt/myhome/docker/docker-compose.yml logs -f"
