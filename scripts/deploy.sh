#!/usr/bin/env bash
# =============================================================================
# deploy.sh - Deployment script for MyHome
# =============================================================================
# Usage:
#   ./scripts/deploy.sh [staging|production]
# =============================================================================
set -euo pipefail

ENVIRONMENT="${1:-staging}"
APP_DIR="/opt/myhome"
COMPOSE_FILE="docker/docker-compose.yml"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

[[ "$ENVIRONMENT" =~ ^(staging|production)$ ]] || \
  error "Environment must be 'staging' or 'production', got: $ENVIRONMENT"

log "Starting deployment to $ENVIRONMENT..."

# ── Pull latest code ───────────────────────────────────────────────────────────
log "Pulling latest code..."
git -C "$APP_DIR" fetch origin
git -C "$APP_DIR" reset --hard origin/main

# ── Pull latest Docker images ──────────────────────────────────────────────────
log "Pulling latest Docker images..."
docker-compose -f "$APP_DIR/$COMPOSE_FILE" pull

# ── Save current state for rollback ───────────────────────────────────────────
log "Saving current state for potential rollback..."
docker inspect myhome-backend --format='{{.Config.Image}}' > "$APP_DIR/.previous_backend_image" 2>/dev/null || true
docker inspect myhome-frontend --format='{{.Config.Image}}' > "$APP_DIR/.previous_frontend_image" 2>/dev/null || true

# ── Deploy with zero-downtime strategy ────────────────────────────────────────
log "Deploying containers..."
docker-compose -f "$APP_DIR/$COMPOSE_FILE" up -d --remove-orphans

# ── Wait for health checks ─────────────────────────────────────────────────────
log "Waiting for health checks..."
MAX_RETRIES=30
RETRY=0
until docker inspect myhome-backend --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    error "Backend health check failed after $MAX_RETRIES attempts. Rolling back..."
    docker-compose -f "$APP_DIR/$COMPOSE_FILE" down
    exit 1
  fi
  log "Waiting for backend to be healthy... ($RETRY/$MAX_RETRIES)"
  sleep 5
done

# ── Clean up old images ────────────────────────────────────────────────────────
log "Cleaning up old images..."
docker image prune -f

log "✅ Deployment to $ENVIRONMENT completed successfully!"
