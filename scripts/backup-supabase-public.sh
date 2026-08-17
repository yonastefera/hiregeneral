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
require_value SUPABASE_DB_URL
require_value BACKUP_AGE_RECIPIENT

backup_directory="${BACKUP_OUTPUT_DIR:-./backups}"
backup_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_directory}/hiregeneral-public-${backup_timestamp}.dump.age"

mkdir -p "$backup_directory"
umask 077

echo "Creating encrypted public-schema backup..."

export DATABASE_URL="$SUPABASE_DB_URL"

docker run --rm \
  --env DATABASE_URL \
  postgres:17-alpine \
  sh -c 'exec pg_dump --dbname="$DATABASE_URL" --schema=public --format=custom --no-owner --no-privileges' \
  | age --recipient "$BACKUP_AGE_RECIPIENT" --output "$backup_path"

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

echo "Encrypted backup created: $backup_path"
echo "Checksum created: $checksum_path"
