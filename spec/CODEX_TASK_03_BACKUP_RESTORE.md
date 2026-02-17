# CODEX_TASK_03 — Backup & Restore Automation (Backend Only)

**Priority:** P1
**Effort:** 3–4 hours
**Depends On:** Task 02 (Database Scaling)
**Branch:** `batch7/03-backup-restore`

---

## Objective

Automate database backup, verification, and restore. Create Sidekiq jobs for scheduled backups to S3, verify backups by restoring to a temporary database, and track backup history via a BackupRecord model.

---

## Tasks

### 1. Create BackupRecord Model

Generate the model and migration:

```ruby
class CreateBackupRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :backup_records do |t|
      t.string :backup_type, null: false, default: "full"  # "full", "incremental"
      t.string :status, null: false, default: "in_progress" # "in_progress", "completed", "failed", "verified", "verification_failed"
      t.string :s3_key, null: false
      t.string :s3_bucket, null: false
      t.bigint :size_bytes
      t.integer :duration_seconds
      t.jsonb :metadata, default: {}  # row counts, table list, pg version
      t.string :error_message
      t.datetime :verified_at
      t.jsonb :verification_result, default: {}  # row count comparison per table

      t.timestamps
    end

    add_index :backup_records, :status
    add_index :backup_records, :created_at
    add_index :backup_records, [:backup_type, :status]
  end
end
```

**Note:** BackupRecord is intentionally NOT tenant-scoped. Backups are system-level records. Do NOT include TenantScoped concern.

**File: `apps/core/app/models/backup_record.rb`**

```ruby
class BackupRecord < ApplicationRecord
  # NOT tenant-scoped — backups are system-level

  VALID_STATUSES = %w[in_progress completed failed verified verification_failed].freeze
  VALID_TYPES = %w[full incremental].freeze

  validates :backup_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :s3_key, presence: true
  validates :s3_bucket, presence: true

  scope :recent, -> { order(created_at: :desc).limit(30) }
  scope :successful, -> { where(status: %w[completed verified]) }
  scope :latest_verified, -> { where(status: "verified").order(created_at: :desc).first }

  def mark_completed!(size:, duration:, metadata: {})
    update!(
      status: "completed",
      size_bytes: size,
      duration_seconds: duration,
      metadata: metadata
    )
  end

  def mark_failed!(error:)
    update!(status: "failed", error_message: error)
  end

  def mark_verified!(result:)
    update!(
      status: "verified",
      verified_at: Time.current,
      verification_result: result
    )
  end

  def mark_verification_failed!(result:, error: nil)
    update!(
      status: "verification_failed",
      verified_at: Time.current,
      verification_result: result,
      error_message: error
    )
  end

  def size_mb
    return nil unless size_bytes
    (size_bytes / 1_048_576.0).round(2)
  end
end
```

### 2. Create DatabaseBackupJob

**File: `apps/core/app/jobs/database_backup_job.rb`**

```ruby
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

    start_time = Time.current

    begin
      # 1. Run pg_dump
      db_config = ActiveRecord::Base.connection_db_config.configuration_hash
      dump_command = build_dump_command(db_config, local_path)

      system(dump_command) || raise("pg_dump failed with exit code #{$?.exitstatus}")

      # 2. Get file size
      file_size = File.size(local_path)

      # 3. Upload to S3
      upload_to_s3(local_path, s3_key)

      # 4. Gather metadata
      metadata = {
        pg_version: pg_version,
        table_row_counts: table_row_counts,
        database_size: database_size,
        rails_env: Rails.env,
      }

      # 5. Mark complete
      duration = (Time.current - start_time).to_i
      record.mark_completed!(size: file_size, duration: duration, metadata: metadata)

      Rails.logger.info("[Backup] Completed: #{s3_key} (#{record.size_mb}MB in #{duration}s)")

      # 6. Schedule verification
      BackupVerificationJob.perform_later(record.id)

    rescue => e
      record.mark_failed!(error: e.message)
      Rails.logger.error("[Backup] Failed: #{e.message}")
      raise
    ensure
      File.delete(local_path) if File.exist?(local_path)
    end
  end

  private

  def build_dump_command(config, output_path)
    parts = ["pg_dump"]
    parts << "-h #{Shellwords.escape(config[:host])}" if config[:host]
    parts << "-p #{config[:port]}" if config[:port]
    parts << "-U #{Shellwords.escape(config[:username])}" if config[:username]
    parts << "--no-owner --no-acl"
    parts << "-Fc"  # Custom format (compressed, supports pg_restore)
    parts << Shellwords.escape(config[:database])
    parts << "| gzip > #{Shellwords.escape(output_path.to_s)}"

    env_prefix = config[:password] ? "PGPASSWORD=#{Shellwords.escape(config[:password])} " : ""
    "#{env_prefix}#{parts.join(' ')}"
  end

  def upload_to_s3(local_path, s3_key)
    require "aws-sdk-s3"
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
    ActiveRecord::Base.connection.execute("SELECT version()").first["version"]
  end

  def table_row_counts
    tables = ActiveRecord::Base.connection.tables - %w[schema_migrations ar_internal_metadata]
    tables.each_with_object({}) do |table, counts|
      counts[table] = ActiveRecord::Base.connection.execute("SELECT COUNT(*) AS c FROM #{table}").first["c"]
    end
  end

  def database_size
    result = ActiveRecord::Base.connection.execute(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS size"
    )
    result.first["size"]
  end
end
```

### 3. Create BackupVerificationJob

**File: `apps/core/app/jobs/backup_verification_job.rb`**

```ruby
class BackupVerificationJob < ApplicationJob
  queue_as :low

  def perform(backup_record_id)
    record = BackupRecord.find(backup_record_id)
    return unless record.status == "completed"

    temp_db = "k12_backup_verify_#{record.id}"

    begin
      # 1. Download from S3
      local_path = download_from_s3(record.s3_key, record.s3_bucket)

      # 2. Create temp database
      create_temp_database(temp_db)

      # 3. Restore into temp database
      restore_to_database(local_path, temp_db)

      # 4. Verify row counts match
      verification = verify_row_counts(temp_db, record.metadata["table_row_counts"] || {})

      if verification[:passed]
        record.mark_verified!(result: verification)
        Rails.logger.info("[BackupVerify] Backup #{record.id} verified successfully")
      else
        record.mark_verification_failed!(result: verification, error: "Row count mismatch")
        Rails.logger.warn("[BackupVerify] Backup #{record.id} verification failed: row count mismatch")
      end

    rescue => e
      record.mark_verification_failed!(
        result: { error: e.message },
        error: e.message
      )
      Rails.logger.error("[BackupVerify] Backup #{record.id} verification error: #{e.message}")
    ensure
      drop_temp_database(temp_db)
      File.delete(local_path) if local_path && File.exist?(local_path)
    end
  end

  private

  def download_from_s3(s3_key, s3_bucket)
    require "aws-sdk-s3"
    local_path = Rails.root.join("tmp", "verify_#{SecureRandom.hex(8)}.sql.gz")
    client = Aws::S3::Client.new(region: ENV.fetch("BACKUP_S3_REGION", "us-east-1"))
    client.get_object(
      bucket: s3_bucket,
      key: s3_key,
      response_target: local_path.to_s
    )
    local_path
  end

  def create_temp_database(db_name)
    ActiveRecord::Base.connection.execute("CREATE DATABASE #{db_name}")
  end

  def restore_to_database(local_path, db_name)
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    host_flag = config[:host] ? "-h #{Shellwords.escape(config[:host])}" : ""
    port_flag = config[:port] ? "-p #{config[:port]}" : ""
    user_flag = config[:username] ? "-U #{Shellwords.escape(config[:username])}" : ""
    env_prefix = config[:password] ? "PGPASSWORD=#{Shellwords.escape(config[:password])} " : ""

    cmd = "#{env_prefix}gunzip -c #{Shellwords.escape(local_path.to_s)} | pg_restore #{host_flag} #{port_flag} #{user_flag} -d #{db_name} --no-owner --no-acl 2>&1"
    output = `#{cmd}`
    Rails.logger.info("[BackupVerify] Restore output: #{output.truncate(500)}")
  end

  def verify_row_counts(db_name, expected_counts)
    config = ActiveRecord::Base.connection_db_config.configuration_hash
    temp_config = config.merge(database: db_name)

    # Connect to temp database
    temp_conn = ActiveRecord::Base.postgresql_connection(temp_config)

    results = {}
    mismatches = []

    expected_counts.each do |table, expected_count|
      begin
        actual = temp_conn.execute("SELECT COUNT(*) AS c FROM #{table}").first["c"]
        match = actual == expected_count
        results[table] = { expected: expected_count, actual: actual, match: match }
        mismatches << table unless match
      rescue => e
        results[table] = { expected: expected_count, actual: nil, error: e.message }
        mismatches << table
      end
    end

    temp_conn.disconnect!

    {
      passed: mismatches.empty?,
      tables_checked: expected_counts.size,
      mismatches: mismatches,
      details: results,
    }
  end

  def drop_temp_database(db_name)
    ActiveRecord::Base.connection.execute("DROP DATABASE IF EXISTS #{db_name}")
  rescue => e
    Rails.logger.warn("[BackupVerify] Could not drop temp database #{db_name}: #{e.message}")
  end
end
```

### 4. Create Backup API Controller

**File: `apps/core/app/controllers/api/v1/admin/backups_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class BackupsController < ApplicationController
        before_action :authorize_admin

        # GET /api/v1/admin/backups
        def index
          authorize :backup, :index?
          records = BackupRecord.recent
          render json: records, each_serializer: BackupRecordSerializer
        end

        # GET /api/v1/admin/backups/:id
        def show
          authorize :backup, :show?
          record = BackupRecord.find(params[:id])
          render json: record, serializer: BackupRecordSerializer
        end

        # POST /api/v1/admin/backups
        def create
          authorize :backup, :create?
          DatabaseBackupJob.perform_later(backup_type: params[:backup_type] || "full")
          render json: { message: "Backup job enqueued" }, status: :accepted
        end

        # GET /api/v1/admin/backups/status
        def status
          authorize :backup, :index?
          latest = BackupRecord.successful.order(created_at: :desc).first
          latest_verified = BackupRecord.latest_verified

          render json: {
            latest_backup: latest&.as_json(only: [:id, :status, :created_at, :size_bytes, :duration_seconds]),
            latest_verified: latest_verified&.as_json(only: [:id, :status, :verified_at]),
            total_backups: BackupRecord.count,
            failed_count: BackupRecord.where(status: "failed").where("created_at > ?", 30.days.ago).count,
          }
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end
      end
    end
  end
end
```

### 5. Create Backup Policy

**File: `apps/core/app/policies/backup_policy.rb`**

```ruby
class BackupPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  def show?
    user.has_role?(:admin)
  end

  def create?
    user.has_role?(:admin)
  end
end
```

### 6. Create Backup Serializer

**File: `apps/core/app/serializers/backup_record_serializer.rb`**

```ruby
class BackupRecordSerializer < ActiveModel::Serializer
  attributes :id, :backup_type, :status, :s3_key, :s3_bucket,
    :size_bytes, :size_mb, :duration_seconds, :metadata,
    :error_message, :verified_at, :verification_result,
    :created_at, :updated_at
end
```

### 7. Add Routes

Update `apps/core/config/routes.rb` — add within the `namespace :api` → `namespace :v1` block:

```ruby
namespace :admin do
  resources :backups, only: [:index, :show, :create] do
    collection do
      get :status
    end
  end
end
```

**Note:** Check if a `namespace :admin` block already exists in routes. If so, add the `resources :backups` inside it. If not, create the namespace block.

### 8. Schedule Automated Backups

If Sidekiq::Cron is available (installed in Task 02), schedule the backup:

```ruby
# config/initializers/sidekiq_cron.rb (append to existing)
Sidekiq::Cron::Job.create(
  name: "Daily database backup",
  cron: "0 2 * * *",  # 2 AM daily
  class: "DatabaseBackupJob",
  args: [{ backup_type: "full" }]
) if defined?(Sidekiq::Cron)
```

### 9. Write Tests

**File: `apps/core/spec/models/backup_record_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe BackupRecord, type: :model do
  describe "validations" do
    it "requires backup_type" do
      record = BackupRecord.new(status: "in_progress", s3_key: "test", s3_bucket: "test")
      expect(record).to be_valid  # default is "full"
    end

    it "rejects invalid backup_type" do
      record = BackupRecord.new(backup_type: "invalid", status: "in_progress", s3_key: "t", s3_bucket: "t")
      expect(record).not_to be_valid
    end

    it "rejects invalid status" do
      record = BackupRecord.new(backup_type: "full", status: "invalid", s3_key: "t", s3_bucket: "t")
      expect(record).not_to be_valid
    end

    it "requires s3_key" do
      record = BackupRecord.new(backup_type: "full", status: "in_progress", s3_bucket: "t")
      expect(record).not_to be_valid
    end

    it "requires s3_bucket" do
      record = BackupRecord.new(backup_type: "full", status: "in_progress", s3_key: "t")
      expect(record).not_to be_valid
    end
  end

  describe "#mark_completed!" do
    it "updates status, size, duration, and metadata" do
      record = BackupRecord.create!(backup_type: "full", status: "in_progress", s3_key: "t", s3_bucket: "t")
      record.mark_completed!(size: 1024, duration: 60, metadata: { pg_version: "16" })

      expect(record.status).to eq("completed")
      expect(record.size_bytes).to eq(1024)
      expect(record.duration_seconds).to eq(60)
      expect(record.metadata["pg_version"]).to eq("16")
    end
  end

  describe "#mark_verified!" do
    it "updates status and verified_at" do
      record = BackupRecord.create!(backup_type: "full", status: "completed", s3_key: "t", s3_bucket: "t")
      record.mark_verified!(result: { passed: true })

      expect(record.status).to eq("verified")
      expect(record.verified_at).to be_present
    end
  end

  describe "#size_mb" do
    it "converts bytes to MB" do
      record = BackupRecord.new(size_bytes: 10_485_760)
      expect(record.size_mb).to eq(10.0)
    end

    it "returns nil when size_bytes is nil" do
      record = BackupRecord.new(size_bytes: nil)
      expect(record.size_mb).to be_nil
    end
  end

  describe "scopes" do
    it ".recent returns latest 30 ordered by created_at desc" do
      35.times { |i| BackupRecord.create!(backup_type: "full", status: "completed", s3_key: "k#{i}", s3_bucket: "b") }
      expect(BackupRecord.recent.count).to eq(30)
    end
  end
end
```

**File: `apps/core/spec/jobs/database_backup_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe DatabaseBackupJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "enqueues the job" do
    expect {
      described_class.perform_later(backup_type: "full")
    }.to have_enqueued_job(described_class)
  end
end
```

**File: `apps/core/spec/jobs/backup_verification_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe BackupVerificationJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "skips records that are not completed" do
    record = BackupRecord.create!(backup_type: "full", status: "failed", s3_key: "t", s3_bucket: "t")
    expect { described_class.perform_now(record.id) }.not_to raise_error
    expect(record.reload.status).to eq("failed")  # unchanged
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/backups_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::Backups", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/backups" do
    it "returns backup records for admin" do
      mock_session(admin, tenant: tenant)
      BackupRecord.create!(backup_type: "full", status: "completed", s3_key: "test", s3_bucket: "b")

      get "/api/v1/admin/backups"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for non-admin" do
      mock_session(teacher, tenant: tenant)
      get "/api/v1/admin/backups"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/admin/backups" do
    it "enqueues a backup job for admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/admin/backups", params: { backup_type: "full" }
      }.to have_enqueued_job(DatabaseBackupJob)

      expect(response).to have_http_status(:accepted)
    end
  end

  describe "GET /api/v1/admin/backups/status" do
    it "returns backup status summary" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/backups/status"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("total_backups")
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `db/migrate/YYYYMMDDHHMMSS_create_backup_records.rb` | BackupRecord table |
| `apps/core/app/models/backup_record.rb` | Backup tracking model |
| `apps/core/app/jobs/database_backup_job.rb` | Automated pg_dump to S3 |
| `apps/core/app/jobs/backup_verification_job.rb` | Restore and verify backup |
| `apps/core/app/controllers/api/v1/admin/backups_controller.rb` | Backup management API |
| `apps/core/app/policies/backup_policy.rb` | Admin-only access |
| `apps/core/app/serializers/backup_record_serializer.rb` | Backup JSON serialization |
| `apps/core/spec/models/backup_record_spec.rb` | Model tests |
| `apps/core/spec/jobs/database_backup_job_spec.rb` | Backup job tests |
| `apps/core/spec/jobs/backup_verification_job_spec.rb` | Verification job tests |
| `apps/core/spec/requests/api/v1/admin/backups_spec.rb` | API tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/routes.rb` | Add `namespace :admin { resources :backups }` |
| `apps/core/Gemfile` | Add `aws-sdk-s3` if not present |
| Sidekiq cron config | Schedule daily backup at 2 AM |

---

## Definition of Done

- [ ] BackupRecord model created with validations and lifecycle methods
- [ ] DatabaseBackupJob runs pg_dump, gzips, uploads to S3, records metadata
- [ ] BackupVerificationJob restores to temp DB and compares row counts
- [ ] Backup API provides list, detail, trigger, and status endpoints
- [ ] Only admin users can access backup endpoints
- [ ] Automated backup scheduled daily at 2 AM
- [ ] All model, job, and request specs pass
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
