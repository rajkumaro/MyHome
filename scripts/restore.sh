#!/usr/bin/env bash
# =============================================================================
# restore.sh - Database restore script for MyHome
# =============================================================================
# Usage:
#   ./scripts/restore.sh <backup_file> [local|s3]
# =============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
SOURCE="${2:-local}"
BACKUP_DIR="/var/backups/myhome"
CONTAINER_NAME="myhome-mongodb"
DB_NAME="${MONGO_DB_NAME:-myhome}"
S3_BUCKET="${S3_BACKUP_BUCKET:-myhome-backups}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

[ -n "$BACKUP_FILE" ] || error "Usage: $0 <backup_file> [local|s3]"

# ── Download from S3 if needed ─────────────────────────────────────────────────
if [ "$SOURCE" == "s3" ]; then
  command -v aws &>/dev/null || error "AWS CLI is not installed."
  log "Downloading backup from S3..."
  mkdir -p "$BACKUP_DIR"
  aws s3 cp "s3://$S3_BUCKET/mongodb/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"
fi

LOCAL_BACKUP="$BACKUP_DIR/$BACKUP_FILE"
[ -f "$LOCAL_BACKUP" ] || error "Backup file not found: $LOCAL_BACKUP"

# ── Confirmation prompt ────────────────────────────────────────────────────────
log "⚠️  WARNING: This will overwrite the database '$DB_NAME'."
read -r -p "Are you sure you want to restore from $BACKUP_FILE? [yes/N] " CONFIRM
[ "$CONFIRM" == "yes" ] || { log "Restore cancelled."; exit 0; }

# ── Extract backup ─────────────────────────────────────────────────────────────
TEMP_DIR=$(mktemp -d)
log "Extracting backup..."
tar -xzf "$LOCAL_BACKUP" -C "$TEMP_DIR"

# ── Copy to container and restore ─────────────────────────────────────────────
log "Restoring database..."
docker cp "$TEMP_DIR/mongodump" "$CONTAINER_NAME:/tmp/mongodump"

docker exec "$CONTAINER_NAME" mongorestore \
  --authenticationDatabase admin \
  --username "${MONGO_ROOT_USERNAME:-admin}" \
  --password "${MONGO_ROOT_PASSWORD:-password}" \
  --db "$DB_NAME" \
  --drop \
  "/tmp/mongodump/$DB_NAME"

docker exec "$CONTAINER_NAME" rm -rf /tmp/mongodump
rm -rf "$TEMP_DIR"

log "✅ Database restored successfully from $BACKUP_FILE"
