class AddArchivedAtToAuditLogsAndSyncLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :audit_logs, :archived_at, :datetime
    add_column :sync_logs, :archived_at, :datetime
  end
end
