require "open3"
require "securerandom"
require "zlib"

class BackupVerificationJob < ApplicationJob
  queue_as :low

  def perform(backup_record_id)
    record = BackupRecord.find(backup_record_id)
    return unless record.status == "completed"

    temp_db_name = "k12_backup_verify_#{record.id}"
    local_path = nil

    begin
      local_path = download_from_s3(record.s3_key, record.s3_bucket)
      create_temp_database(temp_db_name)
      restore_to_database(local_path, temp_db_name)

      verification_result = verify_row_counts(temp_db_name, record.metadata["table_row_counts"] || {})
      if verification_result[:passed]
        record.mark_verified!(result: verification_result)
      else
        record.mark_verification_failed!(result: verification_result, error: "Row count mismatch")
      end
    rescue StandardError => e
      record.mark_verification_failed!(result: { error: e.message }, error: e.message)
      Rails.logger.error("[BackupVerificationJob] Verification failed: #{e.message}")
    ensure
      drop_temp_database(temp_db_name)
      safe_delete_temp_file(local_path)
    end
  end

  private

  def download_from_s3(s3_key, s3_bucket)
    local_path = Rails.root.join("tmp", "verify_#{SecureRandom.hex(8)}.sql.gz")
    client = Aws::S3::Client.new(region: ENV.fetch("BACKUP_S3_REGION", "us-east-1"))
    client.get_object(bucket: s3_bucket, key: s3_key, response_target: local_path.to_s)
    local_path
  end

  def create_temp_database(db_name)
    ActiveRecord::Base.connection.execute("CREATE DATABASE #{ActiveRecord::Base.connection.quote_table_name(db_name)}")
  end

  def restore_to_database(local_path, db_name)
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    command = [ "pg_restore", *pg_restore_args(config, db_name), "--no-owner", "--no-acl" ]
    output, status = run_restore_command(command: command, config: config, local_path: local_path)
    Rails.logger.info("[BackupVerificationJob] Restore output: #{output.to_s.truncate(500)}")
    return if status.success?

    raise "pg_restore verification restore failed with exit code #{status.exitstatus}"
  end

  def verify_row_counts(db_name, expected_counts)
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    temp_config = config.merge(database: db_name)
    temp_connection = ActiveRecord::Base.postgresql_connection(temp_config)

    results = {}
    mismatches = []

    expected_counts.each do |table, expected_count|
      quoted_table = ActiveRecord::Base.connection.quote_table_name(table)
      actual_count = temp_connection.select_value("SELECT COUNT(*) FROM #{quoted_table}").to_i
      expected_count_i = expected_count.to_i
      match = actual_count == expected_count_i
      results[table] = { expected: expected_count_i, actual: actual_count, match: match }
      mismatches << table unless match
    rescue StandardError => e
      results[table] = { expected: expected_count.to_i, actual: nil, error: e.message, match: false }
      mismatches << table
    end

    {
      passed: mismatches.empty?,
      tables_checked: expected_counts.size,
      mismatches: mismatches,
      details: results
    }
  ensure
    temp_connection&.disconnect!
  end

  def drop_temp_database(db_name)
    sql = "DROP DATABASE IF EXISTS #{ActiveRecord::Base.connection.quote_table_name(db_name)}"
    ActiveRecord::Base.connection.execute(sql)
  rescue StandardError => e
    Rails.logger.warn("[BackupVerificationJob] Could not drop temp db #{db_name}: #{e.message}")
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
