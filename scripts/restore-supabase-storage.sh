#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 path/to/storage-backup.tar.age" >&2
  exit 1
fi

for command_name in age node tar; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "Required command not found: $command_name" >&2
    exit 1
  }
done

for variable_name in RESTORE_AGE_IDENTITY RESTORE_SUPABASE_URL RESTORE_SUPABASE_SERVICE_ROLE_KEY; do
  if [[ -z "${!variable_name:-}" ]]; then
    echo "Required environment variable is not set: $variable_name" >&2
    exit 1
  fi
done

if [[ "${ALLOW_TEST_STORAGE_RESTORE:-}" != "YES_I_UNDERSTAND" ]]; then
  echo "Refusing Storage restore. Set ALLOW_TEST_STORAGE_RESTORE=YES_I_UNDERSTAND." >&2
  exit 1
fi

backup_path="$1"
if [[ ! -f "$backup_path" ]]; then
  echo "Encrypted Storage backup not found: $backup_path" >&2
  exit 1
fi

temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT
export STORAGE_RESTORE_DIR="${temporary_directory}/storage"
mkdir -p "$STORAGE_RESTORE_DIR"

age --decrypt --identity "$RESTORE_AGE_IDENTITY" "$backup_path" \
  | tar -C "$STORAGE_RESTORE_DIR" -xf -

node scripts/restore-supabase-storage.mjs
