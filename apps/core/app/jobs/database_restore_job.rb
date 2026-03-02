require "open3"
require "securerandom"
require "shellwords"

class DatabaseRestoreJob < ApplicationJob
  queue_as :low

  RESTORABLE_STATUSES = %w[completed verified].freeze

  def perform(backup_record_id:, target_database: nil)
    record = BackupRecord.find(backup_record_id)

    unless RESTORABLE_STATUSES.include?(record.status)
      Rails.logger.error(
        "[Restore] Backup #{backup_record_id} has status '#{record.status}' - only completed/verified backups can be restored"
      )
      return
    end

    target_db = target_database.presence || ActiveRecord::Base.connection_db_config.configuration_hash[:database]
    Rails.logger.warn("[Restore] Starting restore of backup #{record.id} (#{record.s3_key}) into '#{target_db}'")

    local_path = nil

    begin
      local_path = download_from_s3(record.s3_key, record.s3_bucket)
      restore_to_database(local_path, target_db)
      Rails.logger.info("[Restore] Restore of backup #{record.id} into '#{target_db}' completed successfully")
    rescue StandardError => e
      Rails.logger.error("[Restore] Restore of backup #{record.id} failed: #{e.message}")
      raise
    ensure
      File.delete(local_path) if local_path && File.exist?(local_path)
    end
  end

  private

  def download_from_s3(s3_key, s3_bucket)
    local_path = Rails.root.join("tmp", "restore_#{SecureRandom.hex(8)}.sql.gz")
    client = Aws::S3::Client.new(region: ENV.fetch("BACKUP_S3_REGION", "us-east-1"))
    client.get_object(
      bucket: s3_bucket,
      key: s3_key,
      response_target: local_path.to_s
    )
    local_path
  end

  def restore_to_database(local_path, db_name)
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    host_flag = config[:host] ? "-h #{Shellwords.escape(config[:host].to_s)}" : ""
    port_flag = config[:port] ? "-p #{config[:port]}" : ""
    user_flag = config[:username] ? "-U #{Shellwords.escape(config[:username].to_s)}" : ""
    env_prefix = config[:password].present? ? "PGPASSWORD=#{Shellwords.escape(config[:password])} " : ""
    quoted_path = Shellwords.escape(local_path.to_s)
    quoted_db = Shellwords.escape(db_name.to_s)
    command = "#{env_prefix}gunzip -c #{quoted_path} | pg_restore #{host_flag} #{port_flag} #{user_flag} -d #{quoted_db} --no-owner --no-acl --clean 2>&1"

    output, status = Open3.capture2e(command)
    Rails.logger.info("[Restore] pg_restore output: #{output.to_s.truncate(1_000)}")
    return if status.success?

    raise "pg_restore failed with exit code #{status.exitstatus}"
  end
end
