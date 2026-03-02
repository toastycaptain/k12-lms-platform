class BackupService
  RESTORABLE_STATUSES = %w[completed verified].freeze

  class << self
    def trigger_backup(backup_type: "full")
      unless BackupRecord::VALID_TYPES.include?(backup_type)
        raise ArgumentError, "Invalid backup_type: #{backup_type}. Must be one of: #{BackupRecord::VALID_TYPES.join(', ')}"
      end

      DatabaseBackupJob.perform_later(backup_type: backup_type)
    end

    def trigger_restore(backup_record_id:, target_database: nil)
      record = BackupRecord.find(backup_record_id)

      unless RESTORABLE_STATUSES.include?(record.status)
        raise ArgumentError, "Backup #{backup_record_id} is not in a restorable state (status: #{record.status})"
      end

      DatabaseRestoreJob.perform_later(
        backup_record_id: backup_record_id,
        target_database: target_database
      )
    end

    def status_summary
      {
        total_backups: BackupRecord.count,
        latest_backup: BackupRecord.successful.order(created_at: :desc).first,
        latest_verified: BackupRecord.latest_verified,
        failed_last_30_days: BackupRecord.where(status: "failed")
          .where("created_at > ?", 30.days.ago)
          .count
      }
    end
  end
end
