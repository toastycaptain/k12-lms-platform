#!/usr/bin/env bash
set -euo pipefail

timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
env_name="${BACKUP_ENVIRONMENT:-production}"
backup_root="${BACKUP_DIR:-/tmp/k12-lms-backups}"
backup_dir="${backup_root}/${env_name}"
mkdir -p "${backup_dir}"

db_name="${POSTGRES_DB:-core_production}"
db_user="${POSTGRES_USER:-postgres}"
db_host="${POSTGRES_HOST:-localhost}"
db_port="${POSTGRES_PORT:-5432}"

archive_file="${backup_dir}/${db_name}_${timestamp}.dump"

echo "Starting backup for ${db_name} at ${timestamp}"
pg_dump \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --host="${db_host}" \
  --port="${db_port}" \
  --username="${db_user}" \
  --dbname="${db_name}" \
  --file="${archive_file}"

echo "Backup written: ${archive_file}"

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    echo "Uploading backup to ${BACKUP_S3_URI}"
    aws s3 cp "${archive_file}" "${BACKUP_S3_URI%/}/${env_name}/$(basename "${archive_file}")"
  else
    echo "AWS CLI not found; skipping S3 upload" >&2
  fi
fi

if [[ -n "${BACKUP_RETENTION_DAYS:-}" ]]; then
  echo "Pruning local backups older than ${BACKUP_RETENTION_DAYS} days from ${backup_dir}"
  find "${backup_dir}" -type f -name "*.dump" -mtime "+${BACKUP_RETENTION_DAYS}" -delete
fi

echo "Backup complete"
