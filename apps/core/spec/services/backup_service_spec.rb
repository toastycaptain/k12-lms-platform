require "rails_helper"

RSpec.describe BackupService do
  describe ".trigger_backup" do
    it "enqueues DatabaseBackupJob" do
      expect { described_class.trigger_backup }.to have_enqueued_job(DatabaseBackupJob)
    end

    it "raises on invalid backup_type" do
      expect { described_class.trigger_backup(backup_type: "invalid") }.to raise_error(ArgumentError)
    end
  end

  describe ".trigger_restore" do
    it "raises when backup is not in a restorable state" do
      record = create(:backup_record, status: "failed")
      expect { described_class.trigger_restore(backup_record_id: record.id) }.to raise_error(ArgumentError)
    end

    it "enqueues DatabaseRestoreJob for a completed backup" do
      record = create(:backup_record, status: "completed")

      expect {
        described_class.trigger_restore(backup_record_id: record.id)
      }.to have_enqueued_job(DatabaseRestoreJob)
    end
  end

  describe ".status_summary" do
    it "returns expected keys" do
      summary = described_class.status_summary

      expect(summary).to include(
        :total_backups,
        :latest_backup,
        :latest_verified,
        :failed_last_30_days
      )
    end
  end
end
