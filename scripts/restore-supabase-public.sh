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

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 path/to/backup.dump.age" >&2
  exit 1
fi

require_command age
require_command docker
require_command node
require_value RESTORE_SUPABASE_DB_URL
require_value RESTORE_EXPECTED_HOST
require_value RESTORE_AGE_IDENTITY

if [[ "${ALLOW_TEST_DATABASE_RESTORE:-}" != "YES_I_UNDERSTAND" ]]; then
  echo "Refusing destructive restore. Set ALLOW_TEST_DATABASE_RESTORE=YES_I_UNDERSTAND." >&2
  exit 1
fi

backup_path="$1"
if [[ ! -f "$backup_path" ]]; then
  echo "Encrypted backup not found: $backup_path" >&2
  exit 1
fi

restore_host="$(node -e 'console.log(new URL(process.env.RESTORE_SUPABASE_DB_URL).hostname)')"
if [[ "$restore_host" != "$RESTORE_EXPECTED_HOST" ]]; then
  echo "Restore host mismatch. Expected $RESTORE_EXPECTED_HOST, received $restore_host." >&2
  exit 1
fi

if [[ -n "${PRODUCTION_DATABASE_HOST:-}" && "$restore_host" == "$PRODUCTION_DATABASE_HOST" ]]; then
  echo "Refusing to restore into the configured production host." >&2
  exit 1
fi

echo "Restoring public, Auth, and Storage metadata into test host: $restore_host"

age --decrypt --identity "$RESTORE_AGE_IDENTITY" "$backup_path" \
  | docker run --rm --interactive \
    --env DATABASE_URL="$RESTORE_SUPABASE_DB_URL" \
    postgres:17-alpine \
    sh -c 'exec pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-privileges --exit-on-error'

echo "Database restore completed. Restore the matching Storage object artifact before verification."
