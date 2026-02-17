# CODEX_TASK_04 — Monitoring & Alerting (Backend Only)

**Priority:** P1
**Effort:** 6–8 hours
**Depends On:** Task 02 (Database Scaling)
**Branch:** `batch7/04-monitoring-alerting`

---

## Objective

Build a backend monitoring engine: health aggregation service, configurable alert thresholds, evaluation job, and Slack notification delivery. Expose all data via API for future frontend consumption.

---

## Tasks

### 1. Create AlertConfiguration Model

```ruby
class CreateAlertConfigurations < ActiveRecord::Migration[8.0]
  def change
    create_table :alert_configurations do |t|
      t.references :tenant, null: true, foreign_key: true  # nil = system-wide alert
      t.string :name, null: false
      t.string :metric, null: false          # "db_connection_pool", "response_time_p95", "error_rate", "sidekiq_queue_depth", "disk_usage"
      t.string :comparison, null: false      # "gt", "lt", "gte", "lte", "eq"
      t.float :threshold, null: false
      t.string :severity, null: false, default: "warning"  # "info", "warning", "critical"
      t.boolean :enabled, null: false, default: true
      t.string :notification_channel, null: false, default: "slack"  # "slack", "email"
      t.string :notification_target          # Slack webhook URL or email address
      t.integer :cooldown_minutes, default: 30  # Don't re-alert within cooldown
      t.datetime :last_triggered_at
      t.integer :trigger_count, default: 0

      t.timestamps
    end

    add_index :alert_configurations, :metric
    add_index :alert_configurations, [:enabled, :metric]
    add_index :alert_configurations, :tenant_id
  end
end
```

**File: `apps/core/app/models/alert_configuration.rb`**

```ruby
class AlertConfiguration < ApplicationRecord
  # Optionally tenant-scoped (nil tenant = system-wide)
  belongs_to :tenant, optional: true

  VALID_METRICS = %w[
    db_connection_pool
    db_response_time
    response_time_p95
    error_rate_5m
    sidekiq_queue_depth
    sidekiq_latency
    disk_usage_percent
    memory_usage_percent
    redis_memory
    active_storage_health
    ai_gateway_health
    backup_age_hours
  ].freeze

  VALID_COMPARISONS = %w[gt lt gte lte eq].freeze
  VALID_SEVERITIES = %w[info warning critical].freeze
  VALID_CHANNELS = %w[slack email].freeze

  validates :name, presence: true
  validates :metric, presence: true, inclusion: { in: VALID_METRICS }
  validates :comparison, presence: true, inclusion: { in: VALID_COMPARISONS }
  validates :threshold, presence: true, numericality: true
  validates :severity, presence: true, inclusion: { in: VALID_SEVERITIES }
  validates :notification_channel, presence: true, inclusion: { in: VALID_CHANNELS }

  scope :enabled, -> { where(enabled: true) }
  scope :system_wide, -> { where(tenant_id: nil) }

  def evaluate(current_value)
    case comparison
    when "gt" then current_value > threshold
    when "lt" then current_value < threshold
    when "gte" then current_value >= threshold
    when "lte" then current_value <= threshold
    when "eq" then current_value == threshold
    else false
    end
  end

  def in_cooldown?
    return false if last_triggered_at.nil?
    last_triggered_at > cooldown_minutes.minutes.ago
  end

  def trigger!
    update!(
      last_triggered_at: Time.current,
      trigger_count: trigger_count + 1
    )
  end
end
```

### 2. Create SystemHealthService

**File: `apps/core/app/services/system_health_service.rb`**

```ruby
class SystemHealthService
  def self.check_all
    {
      timestamp: Time.current.iso8601,
      overall: overall_status,
      checks: {
        database: database_health,
        redis: redis_health,
        sidekiq: sidekiq_health,
        storage: storage_health,
        ai_gateway: ai_gateway_health,
      },
      metrics: {
        db_connection_pool: db_connection_pool_usage,
        db_response_time: db_response_time,
        sidekiq_queue_depth: sidekiq_queue_depth,
        sidekiq_latency: sidekiq_latency,
        memory_usage_percent: memory_usage,
        backup_age_hours: backup_age_hours,
      },
    }
  end

  def self.overall_status
    checks = [database_health, redis_health, sidekiq_health]
    return "critical" if checks.any? { |c| c[:status] == "critical" }
    return "warning" if checks.any? { |c| c[:status] == "warning" }
    "healthy"
  end

  # --- Individual Health Checks ---

  def self.database_health
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    ActiveRecord::Base.connection.execute("SELECT 1")
    latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)

    status = latency > 500 ? "warning" : "healthy"
    { status: status, latency_ms: latency }
  rescue => e
    { status: "critical", error: e.message }
  end

  def self.redis_health
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Redis.new(url: ENV["REDIS_URL"]).ping
    latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)

    { status: "healthy", latency_ms: latency }
  rescue => e
    { status: "critical", error: e.message }
  end

  def self.sidekiq_health
    stats = Sidekiq::Stats.new
    queue_size = stats.enqueued
    status = if queue_size > 1000
      "critical"
    elsif queue_size > 100
      "warning"
    else
      "healthy"
    end

    {
      status: status,
      enqueued: queue_size,
      processed: stats.processed,
      failed: stats.failed,
      workers: Sidekiq::Workers.new.size,
    }
  rescue => e
    { status: "critical", error: e.message }
  end

  def self.storage_health
    # Verify Active Storage is accessible by checking the service
    service = ActiveStorage::Blob.service
    { status: "healthy", service: service.class.name }
  rescue => e
    { status: "critical", error: e.message }
  end

  def self.ai_gateway_health
    url = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
    response = Faraday.get("#{url}/v1/health") { |req| req.options.timeout = 5 }
    status = response.status == 200 ? "healthy" : "warning"
    { status: status, http_status: response.status }
  rescue Faraday::Error => e
    { status: "critical", error: e.message }
  end

  # --- Metrics ---

  def self.db_connection_pool_usage
    pool = ActiveRecord::Base.connection_pool
    stat = pool.stat
    ((stat[:busy].to_f / stat[:size]) * 100).round(1)
  rescue
    0.0
  end

  def self.db_response_time
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    ActiveRecord::Base.connection.execute("SELECT 1")
    ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)
  rescue
    -1.0
  end

  def self.sidekiq_queue_depth
    Sidekiq::Stats.new.enqueued
  rescue
    -1
  end

  def self.sidekiq_latency
    Sidekiq::Queue.new.latency.round(2)
  rescue
    -1.0
  end

  def self.memory_usage
    if File.exist?("/proc/meminfo")
      meminfo = File.read("/proc/meminfo")
      total = meminfo[/MemTotal:\s+(\d+)/, 1].to_f
      available = meminfo[/MemAvailable:\s+(\d+)/, 1].to_f
      ((1 - available / total) * 100).round(1)
    else
      # macOS fallback
      `memory_pressure 2>/dev/null`[/(\d+)%/, 1]&.to_f || 0.0
    end
  rescue
    0.0
  end

  def self.backup_age_hours
    latest = BackupRecord.where(status: %w[completed verified]).order(created_at: :desc).first
    return -1 if latest.nil?
    ((Time.current - latest.created_at) / 3600.0).round(1)
  rescue
    -1
  end
end
```

### 3. Create AlertEvaluationJob

**File: `apps/core/app/jobs/alert_evaluation_job.rb`**

```ruby
class AlertEvaluationJob < ApplicationJob
  queue_as :default

  def perform
    health = SystemHealthService.check_all
    metrics = health[:metrics]

    AlertConfiguration.enabled.find_each do |config|
      current_value = metrics[config.metric.to_sym]
      next if current_value.nil? || current_value.negative?

      triggered = config.evaluate(current_value)

      if triggered && !config.in_cooldown?
        config.trigger!
        deliver_alert(config, current_value, health)
      end
    end
  end

  private

  def deliver_alert(config, current_value, health)
    case config.notification_channel
    when "slack"
      SlackNotifier.send_alert(
        name: config.name,
        metric: config.metric,
        current_value: current_value,
        threshold: config.threshold,
        comparison: config.comparison,
        severity: config.severity,
        health_summary: health[:overall]
      )
    when "email"
      # Future: send email alert
      Rails.logger.info("[Alert] Email alert for #{config.name}: #{current_value} #{config.comparison} #{config.threshold}")
    end
  end
end
```

Schedule via Sidekiq cron:

```ruby
# config/initializers/sidekiq_cron.rb (append)
Sidekiq::Cron::Job.create(
  name: "Evaluate alerts - every 5 minutes",
  cron: "*/5 * * * *",
  class: "AlertEvaluationJob"
) if defined?(Sidekiq::Cron)
```

### 4. Create UptimeMonitorJob

**File: `apps/core/app/jobs/uptime_monitor_job.rb`**

```ruby
class UptimeMonitorJob < ApplicationJob
  queue_as :default

  ENDPOINTS = [
    { name: "Core API Health", url: -> { "#{ENV.fetch('CORE_URL', 'http://localhost:3000')}/api/v1/health" } },
    { name: "AI Gateway Health", url: -> { "#{ENV.fetch('AI_GATEWAY_URL', 'http://localhost:8000')}/v1/health" } },
  ].freeze

  def perform
    ENDPOINTS.each do |endpoint|
      url = endpoint[:url].call
      check_endpoint(endpoint[:name], url)
    end
  end

  private

  def check_endpoint(name, url)
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    response = Faraday.get(url) { |req| req.options.timeout = 10 }
    latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)

    if response.status != 200
      Rails.logger.warn("[Uptime] #{name} returned #{response.status} (#{latency}ms)")
      SlackNotifier.send_alert(
        name: "Uptime: #{name}",
        metric: "http_status",
        current_value: response.status,
        threshold: 200,
        comparison: "eq",
        severity: "critical",
        health_summary: "Endpoint #{name} returned #{response.status}"
      )
    else
      Rails.logger.info("[Uptime] #{name} OK (#{latency}ms)")
    end
  rescue Faraday::Error => e
    Rails.logger.error("[Uptime] #{name} unreachable: #{e.message}")
    SlackNotifier.send_alert(
      name: "Uptime: #{name}",
      metric: "connectivity",
      current_value: 0,
      threshold: 1,
      comparison: "lt",
      severity: "critical",
      health_summary: "Endpoint #{name} unreachable: #{e.message}"
    )
  end
end
```

Schedule via Sidekiq cron:

```ruby
Sidekiq::Cron::Job.create(
  name: "Uptime monitor - every 2 minutes",
  cron: "*/2 * * * *",
  class: "UptimeMonitorJob"
) if defined?(Sidekiq::Cron)
```

### 5. Create SlackNotifier

**File: `apps/core/app/services/slack_notifier.rb`**

```ruby
class SlackNotifier
  WEBHOOK_URL = ENV["SLACK_ALERT_WEBHOOK_URL"]

  SEVERITY_EMOJI = {
    "info" => ":information_source:",
    "warning" => ":warning:",
    "critical" => ":rotating_light:",
  }.freeze

  def self.send_alert(name:, metric:, current_value:, threshold:, comparison:, severity:, health_summary:)
    return unless WEBHOOK_URL.present?

    emoji = SEVERITY_EMOJI.fetch(severity, ":bell:")
    text = "#{emoji} *#{severity.upcase}: #{name}*\n" \
           "> Metric: `#{metric}` = `#{current_value}` (threshold: #{comparison} #{threshold})\n" \
           "> System: #{health_summary}\n" \
           "> Time: #{Time.current.iso8601}"

    payload = { text: text }

    Faraday.post(WEBHOOK_URL) do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = payload.to_json
      req.options.timeout = 5
    end
  rescue Faraday::Error => e
    Rails.logger.error("[SlackNotifier] Failed to send alert: #{e.message}")
  end

  def self.send_message(text:)
    return unless WEBHOOK_URL.present?

    Faraday.post(WEBHOOK_URL) do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = { text: text }.to_json
      req.options.timeout = 5
    end
  rescue Faraday::Error => e
    Rails.logger.error("[SlackNotifier] Failed to send message: #{e.message}")
  end
end
```

### 6. Create Health & Alert API Controllers

**File: `apps/core/app/controllers/api/v1/admin/operations_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class OperationsController < ApplicationController
        before_action :authorize_admin

        # GET /api/v1/admin/operations/health
        def health
          authorize :operations, :view?
          render json: SystemHealthService.check_all
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

**File: `apps/core/app/controllers/api/v1/admin/alert_configurations_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class AlertConfigurationsController < ApplicationController
        before_action :authorize_admin
        before_action :set_alert_configuration, only: [:show, :update, :destroy]

        # GET /api/v1/admin/alert_configurations
        def index
          authorize AlertConfiguration
          configs = policy_scope(AlertConfiguration).order(:name)
          render json: configs
        end

        # GET /api/v1/admin/alert_configurations/:id
        def show
          authorize @alert_configuration
          render json: @alert_configuration
        end

        # POST /api/v1/admin/alert_configurations
        def create
          @alert_configuration = AlertConfiguration.new(alert_params)
          authorize @alert_configuration

          if @alert_configuration.save
            render json: @alert_configuration, status: :created
          else
            render json: { errors: @alert_configuration.errors.full_messages }, status: :unprocessable_content
          end
        end

        # PUT /api/v1/admin/alert_configurations/:id
        def update
          authorize @alert_configuration

          if @alert_configuration.update(alert_params)
            render json: @alert_configuration
          else
            render json: { errors: @alert_configuration.errors.full_messages }, status: :unprocessable_content
          end
        end

        # DELETE /api/v1/admin/alert_configurations/:id
        def destroy
          authorize @alert_configuration
          @alert_configuration.destroy!
          head :no_content
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end

        def set_alert_configuration
          @alert_configuration = AlertConfiguration.find(params[:id])
        end

        def alert_params
          params.require(:alert_configuration).permit(
            :name, :metric, :comparison, :threshold, :severity,
            :enabled, :notification_channel, :notification_target, :cooldown_minutes
          )
        end
      end
    end
  end
end
```

### 7. Create Policies and Serializer

**File: `apps/core/app/policies/operations_policy.rb`**

```ruby
class OperationsPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end
end
```

**File: `apps/core/app/policies/alert_configuration_policy.rb`**

```ruby
class AlertConfigurationPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  def show?
    user.has_role?(:admin)
  end

  def create?
    user.has_role?(:admin)
  end

  def update?
    user.has_role?(:admin)
  end

  def destroy?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.none
      end
    end
  end
end
```

**File: `apps/core/app/serializers/alert_configuration_serializer.rb`**

```ruby
class AlertConfigurationSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :name, :metric, :comparison, :threshold,
    :severity, :enabled, :notification_channel, :notification_target,
    :cooldown_minutes, :last_triggered_at, :trigger_count,
    :created_at, :updated_at
end
```

### 8. Add Routes

Update `apps/core/config/routes.rb` — add within the `namespace :admin` block:

```ruby
namespace :admin do
  # ... existing routes ...
  resource :operations, only: [] do
    get :health
  end
  resources :alert_configurations
end
```

### 9. Seed Default Alert Configurations

Create a seed or initializer for default system alerts:

**File: `apps/core/db/seeds/alert_defaults.rb`**

```ruby
# Default system-wide alert configurations
defaults = [
  { name: "High DB Connection Pool Usage", metric: "db_connection_pool", comparison: "gt", threshold: 80, severity: "warning" },
  { name: "Critical DB Connection Pool", metric: "db_connection_pool", comparison: "gt", threshold: 95, severity: "critical" },
  { name: "Slow DB Response", metric: "db_response_time", comparison: "gt", threshold: 500, severity: "warning" },
  { name: "Sidekiq Queue Backlog", metric: "sidekiq_queue_depth", comparison: "gt", threshold: 100, severity: "warning" },
  { name: "Critical Sidekiq Backlog", metric: "sidekiq_queue_depth", comparison: "gt", threshold: 1000, severity: "critical" },
  { name: "Sidekiq High Latency", metric: "sidekiq_latency", comparison: "gt", threshold: 60, severity: "warning" },
  { name: "High Memory Usage", metric: "memory_usage_percent", comparison: "gt", threshold: 85, severity: "warning" },
  { name: "Stale Backup", metric: "backup_age_hours", comparison: "gt", threshold: 48, severity: "critical" },
]

defaults.each do |attrs|
  AlertConfiguration.find_or_create_by!(name: attrs[:name]) do |config|
    config.assign_attributes(attrs.merge(
      enabled: true,
      notification_channel: "slack",
      cooldown_minutes: 30
    ))
  end
end
```

Reference this from the main `db/seeds.rb`:

```ruby
load Rails.root.join("db/seeds/alert_defaults.rb")
```

### 10. Write Tests

**File: `apps/core/spec/models/alert_configuration_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe AlertConfiguration, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      config = AlertConfiguration.new(
        name: "Test Alert",
        metric: "db_connection_pool",
        comparison: "gt",
        threshold: 80,
        severity: "warning",
        notification_channel: "slack"
      )
      expect(config).to be_valid
    end

    it "rejects invalid metric" do
      config = AlertConfiguration.new(metric: "invalid_metric")
      expect(config).not_to be_valid
      expect(config.errors[:metric]).to be_present
    end

    it "rejects invalid comparison" do
      config = AlertConfiguration.new(comparison: "invalid")
      expect(config).not_to be_valid
    end

    it "rejects invalid severity" do
      config = AlertConfiguration.new(severity: "invalid")
      expect(config).not_to be_valid
    end
  end

  describe "#evaluate" do
    let(:config) { AlertConfiguration.new(comparison: "gt", threshold: 80) }

    it "returns true when value exceeds threshold" do
      expect(config.evaluate(90)).to be true
    end

    it "returns false when value is below threshold" do
      expect(config.evaluate(70)).to be false
    end

    it "returns false when value equals threshold (gt)" do
      expect(config.evaluate(80)).to be false
    end
  end

  describe "#in_cooldown?" do
    it "returns false when never triggered" do
      config = AlertConfiguration.new(cooldown_minutes: 30, last_triggered_at: nil)
      expect(config.in_cooldown?).to be false
    end

    it "returns true when triggered within cooldown" do
      config = AlertConfiguration.new(cooldown_minutes: 30, last_triggered_at: 10.minutes.ago)
      expect(config.in_cooldown?).to be true
    end

    it "returns false when cooldown has expired" do
      config = AlertConfiguration.new(cooldown_minutes: 30, last_triggered_at: 60.minutes.ago)
      expect(config.in_cooldown?).to be false
    end
  end
end
```

**File: `apps/core/spec/services/system_health_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SystemHealthService do
  describe ".check_all" do
    it "returns a hash with timestamp, overall, checks, and metrics" do
      result = described_class.check_all
      expect(result).to have_key(:timestamp)
      expect(result).to have_key(:overall)
      expect(result).to have_key(:checks)
      expect(result).to have_key(:metrics)
    end

    it "includes database health check" do
      result = described_class.check_all
      expect(result[:checks][:database][:status]).to eq("healthy")
    end

    it "returns db_connection_pool metric" do
      result = described_class.check_all
      expect(result[:metrics][:db_connection_pool]).to be_a(Float)
    end
  end

  describe ".database_health" do
    it "returns healthy status with latency" do
      result = described_class.database_health
      expect(result[:status]).to eq("healthy")
      expect(result[:latency_ms]).to be_a(Float)
    end
  end

  describe ".sidekiq_health" do
    it "returns health status with queue info" do
      result = described_class.sidekiq_health
      expect(result).to have_key(:status)
      expect(result).to have_key(:enqueued)
    end
  end
end
```

**File: `apps/core/spec/services/slack_notifier_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SlackNotifier do
  describe ".send_alert" do
    context "when SLACK_ALERT_WEBHOOK_URL is not set" do
      before { stub_const("SlackNotifier::WEBHOOK_URL", nil) }

      it "does nothing" do
        expect(Faraday).not_to receive(:post)
        described_class.send_alert(
          name: "Test", metric: "cpu", current_value: 90,
          threshold: 80, comparison: "gt", severity: "warning",
          health_summary: "healthy"
        )
      end
    end

    context "when SLACK_ALERT_WEBHOOK_URL is set" do
      before { stub_const("SlackNotifier::WEBHOOK_URL", "https://hooks.slack.com/test") }

      it "posts to Slack webhook" do
        stub = stub_request(:post, "https://hooks.slack.com/test")
          .to_return(status: 200)

        described_class.send_alert(
          name: "Test", metric: "cpu", current_value: 90,
          threshold: 80, comparison: "gt", severity: "warning",
          health_summary: "healthy"
        )

        expect(stub).to have_been_requested
      end
    end
  end
end
```

**File: `apps/core/spec/jobs/alert_evaluation_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe AlertEvaluationJob, type: :job do
  it "evaluates all enabled alert configurations" do
    config = AlertConfiguration.create!(
      name: "Test Alert",
      metric: "db_connection_pool",
      comparison: "gt",
      threshold: 0.0,  # Will always trigger since pool usage > 0
      severity: "warning",
      notification_channel: "slack",
      enabled: true,
      cooldown_minutes: 0
    )

    allow(SlackNotifier).to receive(:send_alert)
    described_class.perform_now

    expect(config.reload.trigger_count).to be >= 1
  end

  it "respects cooldown period" do
    config = AlertConfiguration.create!(
      name: "Test Alert",
      metric: "db_connection_pool",
      comparison: "gt",
      threshold: 0.0,
      severity: "warning",
      notification_channel: "slack",
      enabled: true,
      cooldown_minutes: 60,
      last_triggered_at: 5.minutes.ago,
      trigger_count: 1
    )

    allow(SlackNotifier).to receive(:send_alert)
    described_class.perform_now

    expect(config.reload.trigger_count).to eq(1)  # Not incremented
  end

  it "skips disabled configurations" do
    AlertConfiguration.create!(
      name: "Disabled Alert",
      metric: "db_connection_pool",
      comparison: "gt",
      threshold: 0.0,
      severity: "warning",
      notification_channel: "slack",
      enabled: false
    )

    expect(SlackNotifier).not_to receive(:send_alert)
    described_class.perform_now
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/operations_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::Operations", type: :request do
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

  describe "GET /api/v1/admin/operations/health" do
    it "returns health data for admin" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/operations/health"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to have_key("checks")
      expect(body).to have_key("metrics")
    end

    it "returns 403 for non-admin" do
      mock_session(teacher, tenant: tenant)
      get "/api/v1/admin/operations/health"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/alert_configurations_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::AlertConfigurations", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/alert_configurations" do
    it "returns alert configurations for admin" do
      mock_session(admin, tenant: tenant)
      AlertConfiguration.create!(
        name: "Test", metric: "db_connection_pool", comparison: "gt",
        threshold: 80, severity: "warning", notification_channel: "slack"
      )

      get "/api/v1/admin/alert_configurations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/admin/alert_configurations" do
    it "creates a new alert configuration" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/alert_configurations", params: {
        alert_configuration: {
          name: "High CPU",
          metric: "memory_usage_percent",
          comparison: "gt",
          threshold: 90,
          severity: "critical",
          notification_channel: "slack",
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("High CPU")
    end
  end

  describe "PUT /api/v1/admin/alert_configurations/:id" do
    it "updates an alert configuration" do
      mock_session(admin, tenant: tenant)
      config = AlertConfiguration.create!(
        name: "Test", metric: "db_connection_pool", comparison: "gt",
        threshold: 80, severity: "warning", notification_channel: "slack"
      )

      put "/api/v1/admin/alert_configurations/#{config.id}", params: {
        alert_configuration: { threshold: 90 }
      }

      expect(response).to have_http_status(:ok)
      expect(config.reload.threshold).to eq(90)
    end
  end

  describe "DELETE /api/v1/admin/alert_configurations/:id" do
    it "deletes an alert configuration" do
      mock_session(admin, tenant: tenant)
      config = AlertConfiguration.create!(
        name: "Test", metric: "db_connection_pool", comparison: "gt",
        threshold: 80, severity: "warning", notification_channel: "slack"
      )

      delete "/api/v1/admin/alert_configurations/#{config.id}"
      expect(response).to have_http_status(:no_content)
      expect(AlertConfiguration.find_by(id: config.id)).to be_nil
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `db/migrate/YYYYMMDDHHMMSS_create_alert_configurations.rb` | Alert config table |
| `apps/core/app/models/alert_configuration.rb` | Alert threshold model |
| `apps/core/app/services/system_health_service.rb` | Health aggregation |
| `apps/core/app/services/slack_notifier.rb` | Slack webhook delivery |
| `apps/core/app/jobs/alert_evaluation_job.rb` | Periodic alert checking |
| `apps/core/app/jobs/uptime_monitor_job.rb` | External endpoint monitoring |
| `apps/core/app/controllers/api/v1/admin/operations_controller.rb` | Health API |
| `apps/core/app/controllers/api/v1/admin/alert_configurations_controller.rb` | Alert CRUD API |
| `apps/core/app/policies/operations_policy.rb` | Admin-only health access |
| `apps/core/app/policies/alert_configuration_policy.rb` | Admin-only alert access |
| `apps/core/app/serializers/alert_configuration_serializer.rb` | Alert JSON serialization |
| `apps/core/db/seeds/alert_defaults.rb` | Default alert configurations |
| All spec files listed above | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/routes.rb` | Add operations/health, alert_configurations routes under admin namespace |
| `apps/core/db/seeds.rb` | Load alert_defaults.rb |
| Sidekiq cron config | Schedule AlertEvaluationJob (5 min), UptimeMonitorJob (2 min) |
| `apps/core/Gemfile` | Add `webmock` to test group if not present (for Slack stub tests) |

---

## Definition of Done

- [ ] AlertConfiguration model with validation, evaluate, cooldown logic
- [ ] SystemHealthService checks database, Redis, Sidekiq, storage, AI gateway
- [ ] SystemHealthService returns numeric metrics for all alert-checkable values
- [ ] AlertEvaluationJob runs every 5 minutes, evaluates all enabled alerts
- [ ] UptimeMonitorJob pings Core API and AI Gateway every 2 minutes
- [ ] SlackNotifier delivers alert messages with severity, metric, and value
- [ ] Health API returns full system health for admins
- [ ] Alert configuration CRUD API works for admins
- [ ] Default alert configurations seeded
- [ ] All model, service, job, and request specs pass
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
