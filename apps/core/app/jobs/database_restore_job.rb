require "open3"
require "securerandom"
require "zlib"

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
      safe_delete_temp_file(local_path)
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
    command = [ "pg_restore", *pg_restore_args(config, db_name), "--no-owner", "--no-acl", "--clean" ]
    output, status = run_restore_command(command: command, config: config, local_path: local_path)
    Rails.logger.info("[Restore] pg_restore output: #{output.to_s.truncate(1_000)}")
    return if status.success?

    raise "pg_restore failed with exit code #{status.exitstatus}"
  end

  def run_restore_command(command:, config:, local_path:)
    output = +""
    status = nil

    Open3.popen2e(pg_env(config), *command) do |stdin, stdout_and_stderr, wait_thread|
      begin
        Zlib::GzipReader.open(local_path.to_s) do |gz|
          IO.copy_stream(gz, stdin)
        end
      ensure
        stdin.close unless stdin.closed?
      end

      output = stdout_and_stderr.read
      status = wait_thread.value
    end

    [ output, status ]
  end

  def pg_restore_args(config, db_name)
    args = []
    args.concat([ "-h", config[:host].to_s ]) if config[:host].present?
    args.concat([ "-p", config[:port].to_s ]) if config[:port].present?
    args.concat([ "-U", config[:username].to_s ]) if config[:username].present?
    args.concat([ "-d", db_name.to_s ])
    args
  end

  def pg_env(config)
    return {} if config[:password].blank?

    { "PGPASSWORD" => config[:password].to_s }
  end

  def safe_delete_temp_file(path)
    return if path.blank?

    resolved_path = Pathname.new(path.to_s).expand_path
    tmp_root = Rails.root.join("tmp").expand_path
    return unless resolved_path.to_s.start_with?("#{tmp_root}/")
    return unless resolved_path.file?

    File.delete(resolved_path)
  end
end
