# Database Backup and Disaster Recovery

## Scope

- Primary backup target: `core_production` (system-of-record data).
- `core_production_cache` and `core_production_queue` are treated as ephemeral and are not primary backup targets.
- All backups are encrypted at rest and stored in an S3-compatible bucket.

## RPO and RTO Targets

- Target `RPO`: <= 1 hour.
- Target `RTO`: <= 4 hours.

## Backup Schedule

- Daily full backup of `core_production` via `pg_dump` (compressed archive format).
- WAL archiving every hour (or continuous archiving where supported) for point-in-time recovery.
- Retention:
  - Daily full backups: 30 days.
  - Weekly backups: 12 weeks.
  - Monthly backups: 12 months.
  - WAL segments: 7 days minimum.

## Storage and Access

- Destination bucket: `s3://k12-lms-db-backups/<environment>/`.
- IAM policy: write-only for backup job, read-only for restore operator role.
- Lifecycle rules enforce retention and automatic expiration.

## Point-in-Time Recovery (PITR)

Recommended tooling:

- `wal-g` for WAL archiving/restoration, or
- PostgreSQL native `pg_basebackup` + WAL archive.

Required settings (managed by DBA/infra):

- `wal_level = replica`
- `archive_mode = on`
- `archive_command` configured to push WAL files to object storage
- Restore command configured for recovery environments

## Restore Runbook

1. Identify restore objective:
   - Latest full restore, or
   - PITR timestamp.
2. Provision replacement PostgreSQL instance with matching major version.
3. Restore the latest full backup:
   - `pg_restore --clean --if-exists --no-owner --no-privileges ...`
4. Apply WAL archive up to target timestamp for PITR.
5. Run Rails data checks:
   - `RAILS_ENV=production bundle exec rails runner "puts ActiveRecord::Base.connection.execute('SELECT 1').first"`
6. Validate application readiness:
   - `GET /up`
   - `GET /api/v1/health`
7. Rotate any credentials exposed during incident handling.
8. Record incident timeline, root cause, and post-incident remediation.

## Backup Script

- Script: `scripts/backup.sh`
- Triggering options:
  - Cron on backup runner host.
  - Scheduled GitHub Actions job invoking the script in a secured runner.

## Connection Pooling Guidance

- For production traffic, place PgBouncer in transaction pooling mode in front of PostgreSQL.
- Initial sizing guidance:
  - App (`core_production`) pool per Puma process: match `RAILS_MAX_THREADS`.
  - PgBouncer default pool size: 20-50 per database/user pair (tune from real traffic).
  - Keep PostgreSQL `max_connections` lower than aggregate app pool demand and let PgBouncer multiplex.
- Revisit pool sizes after load testing and quarterly traffic review.
