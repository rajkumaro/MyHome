#!/usr/bin/env bash
# =============================================================================
# backup.sh - Database backup script for MyHome
# =============================================================================
# Usage:
#   ./scripts/backup.sh [local|s3]
# =============================================================================
set -euo pipefail

BACKUP_TYPE="${1:-local}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="/var/backups/myhome"
BACKUP_FILE="myhome_mongodb_${TIMESTAMP}.tar.gz"
CONTAINER_NAME="myhome-mongodb"
DB_NAME="${MONGO_DB_NAME:-myhome}"
S3_BUCKET="${S3_BACKUP_BUCKET:-myhome-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

# ── Check dependencies ─────────────────────────────────────────────────────────
command -v docker &>/dev/null || error "Docker is not installed."

# ── Create backup directory ────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── MongoDB backup ─────────────────────────────────────────────────────────────
log "Starting MongoDB backup..."
TEMP_DIR=$(mktemp -d)

docker exec "$CONTAINER_NAME" mongodump \
  --authenticationDatabase admin \
  --username "${MONGO_ROOT_USERNAME:-admin}" \
  --password "${MONGO_ROOT_PASSWORD:-password}" \
  --db "$DB_NAME" \
  --out /tmp/mongodump

docker cp "$CONTAINER_NAME:/tmp/mongodump" "$TEMP_DIR/"
docker exec "$CONTAINER_NAME" rm -rf /tmp/mongodump

# ── Compress backup ────────────────────────────────────────────────────────────
log "Compressing backup..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$TEMP_DIR" mongodump
rm -rf "$TEMP_DIR"

log "Backup created: $BACKUP_DIR/$BACKUP_FILE"

# ── Upload to S3 ───────────────────────────────────────────────────────────────
if [ "$BACKUP_TYPE" == "s3" ]; then
  command -v aws &>/dev/null || error "AWS CLI is not installed."
  log "Uploading backup to S3 bucket: $S3_BUCKET..."
  aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/mongodb/$BACKUP_FILE" \
    --storage-class STANDARD_IA
  log "Backup uploaded to s3://$S3_BUCKET/mongodb/$BACKUP_FILE"
fi

# ── Clean up old local backups ─────────────────────────────────────────────────
log "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "myhome_mongodb_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

log "✅ Backup completed: $BACKUP_FILE"
log "Backup size: $(du -sh "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
