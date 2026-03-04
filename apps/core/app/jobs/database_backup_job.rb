require "open3"
require "securerandom"
require "zlib"

class DatabaseBackupJob < ApplicationJob
  queue_as :low

  S3_BUCKET = ENV.fetch("BACKUP_S3_BUCKET", "k12-backups")
  S3_REGION = ENV.fetch("BACKUP_S3_REGION", "us-east-1")

  def perform(backup_type: "full")
    normalized_backup_type = normalize_backup_type!(backup_type)
    timestamp = Time.current.strftime("%Y%m%d_%H%M%S")
    filename = "k12_#{normalized_backup_type}_#{timestamp}.sql.gz"
    s3_key = "backups/#{Date.current.strftime('%Y/%m')}/#{filename}"
    local_path = Rails.root.join("tmp", filename)

    record = BackupRecord.create!(
      backup_type: normalized_backup_type,
      status: "in_progress",
      s3_key: s3_key,
      s3_bucket: S3_BUCKET
    )

    started_at = Time.current

    begin
      db_config = ActiveRecord::Base.connection_db_config.configuration_hash
      dump_database!(db_config, local_path)

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
      safe_delete_temp_file(local_path)
    end
  end

  private

  def dump_database!(config, output_path)
    temp_dump_path = Rails.root.join("tmp", "backup_#{SecureRandom.hex(16)}.dump").to_s
    output, status = Open3.capture2e(pg_env(config), "pg_dump", *pg_dump_args(config, temp_dump_path))
    raise "pg_dump failed with exit code #{status.exitstatus}: #{output.to_s.truncate(500)}" unless status.success?

    compress_dump!(temp_dump_path, output_path)
  ensure
    safe_delete_temp_file(temp_dump_path)
  end

  def pg_dump_args(config, output_path)
    args = []
    args.concat([ "-h", config[:host].to_s ]) if config[:host].present?
    args.concat([ "-p", config[:port].to_s ]) if config[:port].present?
    args.concat([ "-U", config[:username].to_s ]) if config[:username].present?
    args.concat(%w[--no-owner --no-acl -Fc])
    args.concat([ "-f", output_path.to_s ])
    args << config[:database].to_s
    args
  end

  def pg_env(config)
    return {} if config[:password].blank?

    { "PGPASSWORD" => config[:password].to_s }
  end

  def compress_dump!(source_path, output_path)
    File.open(source_path, "rb") do |source|
      Zlib::GzipWriter.open(output_path.to_s) do |gz|
        IO.copy_stream(source, gz)
      end
    end
  end

  def normalize_backup_type!(value)
    normalized = value.to_s.downcase.gsub(/[^a-z0-9_-]/, "")
    if normalized.blank? || normalized.length > 32
      raise ArgumentError, "Invalid backup_type"
    end

    normalized
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

  def safe_delete_temp_file(path)
    return if path.blank?

    resolved_path = Pathname.new(path.to_s).expand_path
    tmp_root = Rails.root.join("tmp").expand_path
    return unless resolved_path.to_s.start_with?("#{tmp_root}/")
    return unless resolved_path.file?

    File.delete(resolved_path)
  end
end
