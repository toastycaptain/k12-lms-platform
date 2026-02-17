# CODEX_MONITORING_ALERTING — Production Alerting, Error Budgets, and Health Dashboards

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Observability, Reliability), TECH-2.11 (Metrics and runbooks)
**Depends on:** CODEX_DATABASE_SCALING (database health endpoints)

---

## Problem

The platform has Sentry for error tracking and structured JSON logging (Batch 4), but no proactive alerting system. When something breaks during school hours, nobody knows until a teacher reports it:

1. **No uptime monitoring** — no automated checks verifying services are responding
2. **No error budget tracking** — no threshold for acceptable error rates (e.g., 99.9% success)
3. **No database alerts** — connection pool exhaustion, slow queries, replication lag invisible
4. **No queue depth alerts** — Sidekiq queue backlog unmonitored; failed jobs silently retry
5. **No AI gateway latency alerts** — generation times may spike without notice
6. **No notification delivery** — alerts exist nowhere; no Slack, email, or PagerDuty integration
7. **No health dashboard** — no single-pane view of system health for operations team
8. **No SLA tracking** — no measurement of actual uptime against targets

---

## Tasks

### 1. Create Health Check Aggregator

Create `apps/core/app/services/system_health_service.rb`:

```ruby
class SystemHealthService
  def call
    {
      status: overall_status,
      timestamp: Time.current.iso8601,
      services: {
        core: core_health,
        database: database_health,
        redis: redis_health,
        sidekiq: sidekiq_health,
        ai_gateway: ai_gateway_health,
        storage: storage_health,
      },
      metrics: {
        error_rate_1h: error_rate(1.hour),
        error_rate_24h: error_rate(24.hours),
        avg_response_time_5m: avg_response_time(5.minutes),
        active_connections: ActiveRecord::Base.connection_pool.stat[:busy],
        queue_depth: Sidekiq::Stats.new.enqueued,
        failed_jobs_24h: Sidekiq::Stats.new.failed,
      },
    }
  end

  private

  def overall_status
    checks = [core_health, database_health, redis_health, sidekiq_health]
    return "critical" if checks.any? { |c| c[:status] == "critical" }
    return "degraded" if checks.any? { |c| c[:status] == "degraded" }
    "healthy"
  end

  def database_health
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    ActiveRecord::Base.connection.execute("SELECT 1")
    latency = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(2)
    {
      status: latency < 100 ? "healthy" : (latency < 500 ? "degraded" : "critical"),
      latency_ms: latency,
      pool: ActiveRecord::Base.connection_pool.stat,
    }
  rescue => e
    { status: "critical", error: e.message }
  end

  # ... redis, sidekiq, ai_gateway, storage checks
end
```

### 2. Create Alert Configuration Model

Create migration:

```ruby
class CreateAlertConfigurations < ActiveRecord::Migration[8.0]
  def change
    create_table :alert_configurations do |t|
      t.string :name, null: false
      t.string :metric, null: false          # "error_rate", "response_time", "queue_depth", etc.
      t.string :condition, null: false       # "above", "below", "equals"
      t.decimal :threshold, null: false
      t.string :severity, null: false, default: "warning"  # "info", "warning", "critical"
      t.string :channel, null: false         # "slack", "email", "webhook"
      t.jsonb :channel_config, null: false, default: {}    # { "url": "...", "emails": [...] }
      t.boolean :enabled, null: false, default: true
      t.integer :cooldown_minutes, null: false, default: 15  # Min time between repeat alerts
      t.datetime :last_fired_at
      t.timestamps
    end
  end
end
```

### 3. Create Alert Evaluation Job

Create `apps/core/app/jobs/alert_evaluation_job.rb`:

```ruby
class AlertEvaluationJob < ApplicationJob
  queue_as :monitoring
  # Run every minute via cron

  def perform
    health = SystemHealthService.new.call

    AlertConfiguration.where(enabled: true).each do |alert|
      value = extract_metric(health, alert.metric)
      next if value.nil?

      if condition_met?(value, alert.condition, alert.threshold)
        fire_alert(alert, value) if cooldown_expired?(alert)
      end
    end
  end

  private

  def fire_alert(alert, current_value)
    case alert.channel
    when "slack"
      SlackNotifier.send(
        url: alert.channel_config["url"],
        text: format_alert(alert, current_value),
        color: severity_color(alert.severity),
      )
    when "email"
      AlertMailer.alert_fired(alert, current_value).deliver_later
    when "webhook"
      WebhookDispatcher.dispatch("system.alert_fired", {
        alert_name: alert.name,
        metric: alert.metric,
        value: current_value,
        threshold: alert.threshold,
        severity: alert.severity,
      })
    end

    alert.update!(last_fired_at: Time.current)

    AuditLogger.log(
      actor: nil,
      action: "alert_fired",
      metadata: { alert_id: alert.id, metric: alert.metric, value: current_value },
    )
  end
end
```

### 4. Create Slack Notifier

Create `apps/core/app/services/slack_notifier.rb`:

```ruby
class SlackNotifier
  def self.send(url:, text:, color: nil)
    payload = {
      attachments: [{
        color: color || "#ff0000",
        text: text,
        ts: Time.current.to_i,
      }],
    }

    Net::HTTP.post(
      URI(url),
      payload.to_json,
      "Content-Type" => "application/json"
    )
  end
end
```

### 5. Create Default Alert Configurations

Create seed data / setup task:

```ruby
# Default alerts for a K-12 LMS
DEFAULTS = [
  { name: "High Error Rate", metric: "error_rate_1h", condition: "above", threshold: 5.0, severity: "critical", cooldown_minutes: 15 },
  { name: "Slow Response Time", metric: "avg_response_time_5m", condition: "above", threshold: 2000, severity: "warning", cooldown_minutes: 30 },
  { name: "Queue Backlog", metric: "queue_depth", condition: "above", threshold: 100, severity: "warning", cooldown_minutes: 15 },
  { name: "Database Connection Exhaustion", metric: "active_connections", condition: "above", threshold: 20, severity: "critical", cooldown_minutes: 5 },
  { name: "Failed Jobs Spike", metric: "failed_jobs_24h", condition: "above", threshold: 50, severity: "warning", cooldown_minutes: 60 },
  { name: "Service Down", metric: "overall_status", condition: "equals", threshold: "critical", severity: "critical", cooldown_minutes: 5 },
]
```

### 6. Create Uptime Monitor Job

Create `apps/core/app/jobs/uptime_monitor_job.rb`:

```ruby
class UptimeMonitorJob < ApplicationJob
  queue_as :monitoring
  # Run every 5 minutes

  ENDPOINTS = {
    "core_api" => { url: "#{ENV['CORE_URL']}/api/v1/health", expected: 200 },
    "web_app" => { url: "#{ENV['WEB_URL']}/login", expected: 200 },
    "ai_gateway" => { url: "#{ENV['AI_GATEWAY_URL']}/v1/health", expected: 200 },
  }.freeze

  def perform
    ENDPOINTS.each do |name, config|
      check_endpoint(name, config)
    end
  end

  private

  def check_endpoint(name, config)
    start = Time.current
    response = Net::HTTP.get_response(URI(config[:url]))
    latency = ((Time.current - start) * 1000).round(2)

    UptimeRecord.create!(
      service_name: name,
      status: response.code.to_i == config[:expected] ? "up" : "down",
      response_code: response.code.to_i,
      latency_ms: latency,
      checked_at: Time.current,
    )
  rescue => e
    UptimeRecord.create!(
      service_name: name,
      status: "down",
      error_message: e.message,
      checked_at: Time.current,
    )
  end
end
```

### 7. Build Operations Health Dashboard

Create `apps/web/src/app/admin/operations/page.tsx`:

**Layout:**
- **Status Banner** — Green/Yellow/Red overall health indicator
- **Service Cards** — Core API, Database, Redis, Sidekiq, AI Gateway, Storage — each with status dot, latency, last check
- **Metrics Panel** — Error rate (1h, 24h), avg response time, queue depth, active connections
- **Uptime Chart** — 24h / 7d / 30d uptime percentage per service (stacked bar or timeline)
- **Alert History** — Recent alert firings: name, severity, metric value, timestamp
- **Active Alerts** — Currently firing alerts with acknowledge button

### 8. Build Alert Configuration Page

Create `apps/web/src/app/admin/operations/alerts/page.tsx`:

- List of configured alerts: name, metric, threshold, severity, channel, enabled toggle
- Create/edit alert modal: metric dropdown, condition, threshold, severity, channel config (Slack URL, email list)
- Test alert button (sends a test notification)
- Alert history per configuration

### 9. Add Tests

**Backend:**
- `apps/core/spec/services/system_health_service_spec.rb` — Returns correct status for healthy/degraded/critical
- `apps/core/spec/jobs/alert_evaluation_job_spec.rb` — Fires alert when threshold exceeded, respects cooldown
- `apps/core/spec/jobs/uptime_monitor_job_spec.rb` — Records up/down status
- `apps/core/spec/services/slack_notifier_spec.rb` — Sends payload to URL

**Frontend:**
- `apps/web/src/app/admin/operations/page.test.tsx` — Renders health status, metrics, uptime chart
- `apps/web/src/app/admin/operations/alerts/page.test.tsx` — Alert list, create, toggle

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/system_health_service.rb` | Health check aggregator |
| `apps/core/app/services/slack_notifier.rb` | Slack webhook sender |
| `apps/core/app/jobs/alert_evaluation_job.rb` | Periodic alert checking |
| `apps/core/app/jobs/uptime_monitor_job.rb` | Endpoint uptime checks |
| `apps/core/db/migrate/YYYYMMDD_create_alert_configurations.rb` | Alert config table |
| `apps/core/db/migrate/YYYYMMDD_create_uptime_records.rb` | Uptime history table |
| `apps/core/app/models/alert_configuration.rb` | Alert config model |
| `apps/core/app/models/uptime_record.rb` | Uptime record model |
| `apps/core/app/controllers/api/v1/admin/operations_controller.rb` | Operations API |
| `apps/core/app/mailers/alert_mailer.rb` | Alert email delivery |
| `apps/web/src/app/admin/operations/page.tsx` | Health dashboard |
| `apps/web/src/app/admin/operations/alerts/page.tsx` | Alert configuration |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add operations and alert routes |
| `apps/web/src/components/AppShell.tsx` | Add "Operations" link under Admin |

---

## Definition of Done

- [ ] SystemHealthService checks core, database, Redis, Sidekiq, AI gateway, and storage
- [ ] Alert configurations support error rate, response time, queue depth, and connection thresholds
- [ ] AlertEvaluationJob fires alerts via Slack, email, or webhook with cooldown
- [ ] UptimeMonitorJob checks 3 service endpoints every 5 minutes
- [ ] Operations dashboard shows service status, metrics, uptime chart, and alert history
- [ ] Alert configuration page allows CRUD with test notification
- [ ] Default alerts seeded for critical metrics
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
