#!/usr/bin/env bash
# =============================================================================
# setup-ssl.sh - SSL/TLS certificate setup using Let's Encrypt
# =============================================================================
# Usage:
#   ./scripts/setup-ssl.sh <domain> <email>
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

[ -n "$DOMAIN" ] || error "Usage: $0 <domain> <email>"
[ -n "$EMAIL" ]  || error "Usage: $0 <domain> <email>"

# ── Install Certbot ────────────────────────────────────────────────────────────
log "Installing Certbot..."
if command -v apt-get &>/dev/null; then
  apt-get update -y
  apt-get install -y certbot python3-certbot-nginx
elif command -v yum &>/dev/null; then
  yum install -y certbot python3-certbot-nginx
else
  error "Unsupported package manager. Please install certbot manually."
fi

# ── Obtain certificate ─────────────────────────────────────────────────────────
log "Obtaining SSL certificate for $DOMAIN..."
certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# ── Update Nginx configuration ─────────────────────────────────────────────────
log "Updating Nginx configuration for HTTPS..."
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

cat > /etc/nginx/conf.d/myhome-ssl.conf << NGINX_EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://$DOMAIN\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate $CERT_PATH/fullchain.pem;
    ssl_certificate_key $CERT_PATH/privkey.pem;
    ssl_trusted_certificate $CERT_PATH/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
NGINX_EOF

nginx -t && systemctl reload nginx

# ── Set up auto-renewal ────────────────────────────────────────────────────────
log "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

log "✅ SSL certificate configured for $DOMAIN"
log "Certificate location: $CERT_PATH"
log "Auto-renewal cron job added."
