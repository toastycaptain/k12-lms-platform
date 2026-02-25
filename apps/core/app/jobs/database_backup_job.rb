require "shellwords"

class DatabaseBackupJob < ApplicationJob
  queue_as :low

  S3_BUCKET = ENV.fetch("BACKUP_S3_BUCKET", "k12-backups")
  S3_REGION = ENV.fetch("BACKUP_S3_REGION", "us-east-1")

  def perform(backup_type: "full")
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    filename = "k12_#{backup_type}_#{timestamp}.sql.gz"
    s3_key = "backups/#{Date.current.strftime('%Y/%m')}/#{filename}"
    local_path = Rails.root.join("tmp", filename)

    record = BackupRecord.create!(
      backup_type: backup_type,
      status: "in_progress",
      s3_key: s3_key,
      s3_bucket: S3_BUCKET
    )

    started_at = Time.current

    begin
      db_config = ActiveRecord::Base.connection_db_config.configuration_hash
      dump_command = build_dump_command(db_config, local_path)
      success = system(dump_command)
      raise "pg_dump failed with exit code #{$?.exitstatus}" unless success

      file_size = File.size(local_path)
      upload_to_s3(local_path, s3_key)

      metadata = {
        pg_version: pg_version,
        table_row_counts: table_row_counts,
        database_size: database_size,
        rails_env: Rails.env
      }

      duration_seconds = (Time.current - started_at).to_i
      record.mark_completed!(size: file_size, duration: duration_seconds, metadata: metadata)
      BackupVerificationJob.perform_later(record.id)
    rescue StandardError => e
      record.mark_failed!(error: e.message)
      Rails.logger.error("[DatabaseBackupJob] Backup failed: #{e.message}")
      raise
    ensure
      File.delete(local_path) if File.exist?(local_path)
    end
  end

  private

  def build_dump_command(config, output_path)
    parts = [ "pg_dump" ]
    parts << "-h #{Shellwords.escape(config[:host].to_s)}" if config[:host]
    parts << "-p #{config[:port]}" if config[:port]
    parts << "-U #{Shellwords.escape(config[:username].to_s)}" if config[:username]
    parts << "--no-owner --no-acl"
    parts << "-Fc"
    parts << Shellwords.escape(config[:database].to_s)
    parts << "| gzip > #{Shellwords.escape(output_path.to_s)}"

    env_prefix = config[:password].present? ? "PGPASSWORD=#{Shellwords.escape(config[:password])} " : ""
    "#{env_prefix}#{parts.join(' ')}"
  end

  def upload_to_s3(local_path, s3_key)
    client = Aws::S3::Client.new(region: S3_REGION)
    File.open(local_path, "rb") do |file|
      client.put_object(
        bucket: S3_BUCKET,
        key: s3_key,
        body: file,
        server_side_encryption: "AES256"
      )
    end
  end

  def pg_version
    ActiveRecord::Base.connection.select_value("SELECT version()")
  end

  def table_row_counts
    tables = ActiveRecord::Base.connection.tables - %w[schema_migrations ar_internal_metadata]
    tables.each_with_object({}) do |table, counts|
      sql = "SELECT COUNT(*) AS count FROM #{ActiveRecord::Base.connection.quote_table_name(table)}"
      counts[table] = ActiveRecord::Base.connection.select_value(sql).to_i
    end
  end

  def database_size
    ActiveRecord::Base.connection.select_value(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS size"
    )
  end
end
