#!/usr/bin/env bash
#
# Nightly PostgreSQL dump for OxyManager.
#
# The shop's entire ledger — every sale, every due, every salary — lives in one
# database on one VPS. Until this ran there was no scheduled copy of it, while
# the homepage promised "নিয়মিত ব্যাকআপ". This closes that gap.
#
# Credentials are read from the app's own .env rather than duplicated here, so
# there is exactly one place a password lives and rotating it does not silently
# break the backups.
#
# Install (as root):
#   ln -sf /var/oxymanager/backend/ops/pg_backup.sh /etc/cron.daily/oxymanager-backup
# or with an explicit time:
#   30 2 * * * root /var/oxymanager/backend/ops/pg_backup.sh
#
# NOTE: this writes to the same machine the database is on. That protects
# against a bad migration, a wrong DELETE, or a corrupted table — not against
# losing the server. Copy BACKUP_DIR offsite (S3, rclone, another VPS) for that.

set -euo pipefail

ENV_FILE="${ENV_FILE:-/var/oxymanager/backend/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/oxymanager}"
LOG_FILE="${LOG_FILE:-/var/log/oxymanager-backup.log}"
KEEP_DAILY="${KEEP_DAILY:-30}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"

log() { printf '%s  %s\n' "$(date '+%F %T')" "$*" >>"$LOG_FILE"; }
die() { log "FAILED: $*"; exit 1; }

[ -r "$ENV_FILE" ] || die "cannot read $ENV_FILE"

# Read only the keys we need. Values are never echoed, and grep -m1 keeps a
# stray duplicate line from silently winning.
env_get() {
  local line
  line="$(grep -m1 "^$1=" "$ENV_FILE" || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  line="${line%\'}"; line="${line#\'}"
  printf '%s' "$line"
}

DB_NAME="$(env_get DB_NAME)"
DB_USER="$(env_get DB_USER)"
DB_HOST="$(env_get DB_HOST)"
DB_PORT="$(env_get DB_PORT)"
PGPASSWORD="$(env_get DB_PASSWORD)"
export PGPASSWORD
: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"

[ -n "$DB_NAME" ] || die "DB_NAME missing from $ENV_FILE"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/monthly"
chmod 700 "$BACKUP_DIR" "$BACKUP_DIR/daily" "$BACKUP_DIR/monthly"

STAMP="$(date '+%Y%m%d_%H%M%S')"
TARGET="$BACKUP_DIR/daily/oxm_${STAMP}.sql.gz"

# Dump to a temp name first: a half-written file that already carries the final
# name is the backup you discover is broken on the day you need it.
TMP="${TARGET}.part"
trap 'rm -f "$TMP"' EXIT

if ! pg_dump --no-owner --no-privileges \
      -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>>"$LOG_FILE" \
      | gzip -9 >"$TMP"; then
  die "pg_dump failed"
fi

# Two checks, because both failure modes are silent: a truncated stream still
# produces a file, and an empty database still produces a valid gzip.
gzip -t "$TMP" 2>>"$LOG_FILE" || die "dump is not a valid gzip"
SIZE="$(stat -c %s "$TMP")"
[ "$SIZE" -gt 10240 ] || die "dump is only ${SIZE} bytes — refusing to keep it"

mv "$TMP" "$TARGET"
chmod 600 "$TARGET"
trap - EXIT

# One copy per month, kept far longer: a table quietly emptied in March is
# rarely noticed within 30 days.
MONTHLY="$BACKUP_DIR/monthly/oxm_$(date '+%Y%m').sql.gz"
[ -e "$MONTHLY" ] || { cp "$TARGET" "$MONTHLY"; chmod 600 "$MONTHLY"; }

# Prune by count, not by age: if the job stops running, the last N survive
# rather than ageing out while nothing replaces them.
prune() {
  local dir="$1" keep="$2"
  ls -1t "$dir"/oxm_*.sql.gz 2>/dev/null | tail -n "+$((keep + 1))" | while read -r old; do
    rm -f -- "$old"
    log "pruned $(basename "$old")"
  done
}
prune "$BACKUP_DIR/daily" "$KEEP_DAILY"
prune "$BACKUP_DIR/monthly" "$KEEP_MONTHLY"

log "ok $(basename "$TARGET") $((SIZE / 1024)) KB · daily=$(ls -1 "$BACKUP_DIR/daily" | wc -l) monthly=$(ls -1 "$BACKUP_DIR/monthly" | wc -l)"
