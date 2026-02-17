# CODEX_BACKUP_RESTORE_AUTOMATION — Automated Backup Verification and Restore Testing

**Priority:** P1
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-23 (Reliability), PRD-15 (Governance and DR), TECH-2.11 (Security)
**Depends on:** CODEX_DATABASE_SCALING (database configuration)

---

## Problem

Backup strategy is documented (`docs/DATABASE_BACKUP.md`) with pg_dump + WAL archiving + S3, but:

1. **Backups never tested** — no automated restore verification; unknown if backups are actually restorable
2. **No backup monitoring** — no alerts if a backup fails or is missing
3. **No point-in-time recovery tested** — WAL archiving documented but PITR never exercised
4. **No backup encryption verification** — backups may or may not be encrypted at rest
5. **No retention policy automation** — old backups not automatically purged
6. **No cross-region replication** — single region; regional outage loses everything
7. **Active Storage files not backed up** — uploaded resources (portfolios, resource library) only in S3 bucket with no versioning

---

## Tasks

### 1. Create Automated Backup Job

Create `apps/core/app/jobs/database_backup_job.rb`:

```ruby
class DatabaseBackupJob < ApplicationJob
  queue_as :maintenance

  def perform
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    filename = "k12_backup_#{timestamp}.sql.gz"
    local_path = Rails.root.join("tmp", filename)

    # Create compressed backup
    system("pg_dump #{database_url} | gzip > #{local_path}")

    unless File.exist?(local_path) && File.size(local_path) > 0
      alert_backup_failure("Backup file empty or not created")
      return
    end

    # Upload to S3
    upload_to_s3(local_path, "backups/daily/#{filename}")

    # Record backup
    BackupRecord.create!(
      filename: filename,
      size_bytes: File.size(local_path),
      storage_path: "backups/daily/#{filename}",
      backup_type: "full",
      status: "completed",
      completed_at: Time.current,
    )

    # Cleanup local file
    FileUtils.rm_f(local_path)

    # Purge old backups (keep 30 days of daily, 12 months of monthly)
    purge_old_backups

    Rails.logger.info("Backup completed: #{filename} (#{File.size(local_path)} bytes)")
  rescue => e
    alert_backup_failure(e.message)
    raise
  end
end
```

### 2. Create Backup Record Model

Create migration:

```ruby
class CreateBackupRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :backup_records do |t|
      t.string :filename, null: false
      t.bigint :size_bytes, null: false
      t.string :storage_path, null: false
      t.string :backup_type, null: false  # "full", "incremental", "wal"
      t.string :status, null: false       # "in_progress", "completed", "failed", "verified"
      t.datetime :completed_at
      t.datetime :verified_at
      t.text :verification_log
      t.timestamps
    end
  end
end
```

### 3. Create Restore Verification Job

Create `apps/core/app/jobs/backup_verification_job.rb`:

```ruby
class BackupVerificationJob < ApplicationJob
  queue_as :maintenance
  # Run weekly: verify the most recent backup is restorable

  def perform(backup_record_id = nil)
    backup = backup_record_id ? BackupRecord.find(backup_record_id) : BackupRecord.where(status: "completed").order(created_at: :desc).first
    return unless backup

    verification_db = "k12_verify_#{SecureRandom.hex(4)}"
    log = []

    begin
      # Download backup from S3
      local_path = download_from_s3(backup.storage_path)
      log << "Downloaded backup: #{backup.filename}"

      # Create temporary database
      system("createdb #{verification_db}")
      log << "Created verification database: #{verification_db}"

      # Restore
      result = system("gunzip -c #{local_path} | psql #{verification_db}")
      log << "Restore result: #{result ? 'SUCCESS' : 'FAILED'}"

      # Verify: check table counts
      conn = ActiveRecord::Base.establish_connection(
        adapter: "postgresql", database: verification_db
      ).connection

      table_counts = {}
      %w[tenants users courses assignments submissions quizzes].each do |table|
        count = conn.execute("SELECT COUNT(*) FROM #{table}").first["count"]
        table_counts[table] = count
        log << "#{table}: #{count} rows"
      end

      backup.update!(
        status: "verified",
        verified_at: Time.current,
        verification_log: log.join("\n"),
      )

      Rails.logger.info("Backup verification passed: #{backup.filename}")
    rescue => e
      log << "VERIFICATION FAILED: #{e.message}"
      backup.update!(verification_log: log.join("\n"))
      alert_verification_failure(backup, e.message)
    ensure
      system("dropdb #{verification_db} --if-exists")
      FileUtils.rm_f(local_path) if local_path
    end
  end
end
```

### 4. Create Backup Monitoring Alert

Add to default alert configurations:

```ruby
{
  name: "Backup Missing",
  metric: "last_backup_age_hours",
  condition: "above",
  threshold: 26,  # Alert if no backup in 26 hours (daily + 2h buffer)
  severity: "critical",
  cooldown_minutes: 60,
}
```

Add metric to SystemHealthService:
```ruby
def backup_health
  last_backup = BackupRecord.where(status: %w[completed verified]).order(created_at: :desc).first
  hours_since = last_backup ? ((Time.current - last_backup.created_at) / 1.hour).round(1) : nil
  {
    last_backup_at: last_backup&.created_at,
    hours_since_last: hours_since,
    last_verified_at: BackupRecord.where(status: "verified").order(verified_at: :desc).first&.verified_at,
    status: hours_since && hours_since < 26 ? "healthy" : "critical",
  }
end
```

### 5. Configure S3 Bucket Versioning for Active Storage

Document and configure:
- Enable S3 bucket versioning for Active Storage bucket (uploaded resources, portfolio files)
- Enable S3 lifecycle policy: transition to Glacier after 90 days, delete after 365 days
- Enable cross-region replication to a secondary region

### 6. Create Backup Admin Page

Create `apps/web/src/app/admin/operations/backups/page.tsx`:

**Layout:**
- **Status Card** — Last backup date, size, status (completed/verified/failed)
- **Backup History** — Table: filename, size, type, status, completed_at, verified_at
- **Manual Actions** — "Run Backup Now" button, "Verify Latest" button
- **Verification Log** — Expandable log for each verified backup showing table counts
- **Retention Policy** — Display current policy (30 daily, 12 monthly)

### 7. Add Tests

- `apps/core/spec/jobs/database_backup_job_spec.rb` — Creates backup, uploads to S3, records to DB, purges old
- `apps/core/spec/jobs/backup_verification_job_spec.rb` — Downloads, restores, verifies table counts
- `apps/core/spec/models/backup_record_spec.rb` — Validations, scopes

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/jobs/database_backup_job.rb` | Automated daily backup |
| `apps/core/app/jobs/backup_verification_job.rb` | Weekly restore verification |
| `apps/core/db/migrate/YYYYMMDD_create_backup_records.rb` | Backup tracking table |
| `apps/core/app/models/backup_record.rb` | Backup record model |
| `apps/web/src/app/admin/operations/backups/page.tsx` | Backup admin page |
| `docs/BACKUP_RESTORE_RUNBOOK.md` | Restore procedures |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/services/system_health_service.rb` | Add backup health metrics |
| `apps/core/config/routes.rb` | Add backup routes |

---

## Definition of Done

- [ ] DatabaseBackupJob creates compressed pg_dump, uploads to S3, records in database
- [ ] BackupVerificationJob restores to temp database and verifies table row counts
- [ ] Backup monitoring alerts if no successful backup in 26 hours
- [ ] Backup history visible in admin operations page
- [ ] Manual backup and verify actions available
- [ ] Old backups automatically purged (30 daily, 12 monthly)
- [ ] S3 versioning enabled for Active Storage bucket
- [ ] Restore runbook documented
- [ ] All tests pass
