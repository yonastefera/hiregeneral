#!/usr/bin/env bash

set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_value() {
  if [[ -z "${!1:-}" ]]; then
    echo "Required environment variable is not set: $1" >&2
    exit 1
  fi
}

require_command age
require_command docker
require_command node
require_command tar
require_value SUPABASE_DB_URL
require_value SUPABASE_URL
require_value SUPABASE_SERVICE_ROLE_KEY
require_value BACKUP_AGE_RECIPIENT

backup_directory="${BACKUP_OUTPUT_DIR:-./backups}"
backup_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
database_backup_path="${backup_directory}/hiregeneral-database-${backup_timestamp}.dump.age"
storage_backup_path="${backup_directory}/hiregeneral-storage-${backup_timestamp}.tar.age"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

mkdir -p "$backup_directory"
umask 077

echo "Creating encrypted public, Auth, and Storage-metadata database backup..."

export DATABASE_URL="$SUPABASE_DB_URL"

docker run --rm \
  --env DATABASE_URL \
  postgres:17-alpine \
  sh -c 'exec pg_dump --dbname="$DATABASE_URL" --schema=public --schema=auth --schema=storage --format=custom --no-owner --no-privileges' \
  | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$database_backup_path"

if [[ ! -s "$database_backup_path" ]]; then
  echo "Encrypted database backup is empty: $database_backup_path" >&2
  exit 1
fi

export STORAGE_BACKUP_DIR="${temporary_directory}/storage"
node scripts/backup-supabase-storage.mjs
tar -C "$STORAGE_BACKUP_DIR" -cf - . \
  | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$storage_backup_path"

for backup_path in "$database_backup_path" "$storage_backup_path"; do
  if [[ ! -s "$backup_path" ]]; then
    echo "Encrypted backup is empty: $backup_path" >&2
    exit 1
  fi
  checksum_path="${backup_path}.sha256"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$backup_path" >"$checksum_path"
  else
    shasum -a 256 "$backup_path" >"$checksum_path"
  fi
done

echo "Encrypted database backup created: $database_backup_path"
echo "Encrypted Storage object backup created: $storage_backup_path"
