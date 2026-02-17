# CODEX_OBSERVABILITY_AND_RUNBOOKS — Structured Logging, Metrics, and Incident Runbooks

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Observability), TECH-2.11 (Metrics and runbooks)
**Depends on:** None

---

## Problem

The platform has basic Rails logging and a slow-query initializer, but lacks:

1. **Structured logging** — logs are unstructured text, hard to query in production log aggregators
2. **Application metrics** — no counters for API requests, job execution, AI invocations, sync operations
3. **Health check depth** — health endpoint checks DB but not Redis, Sidekiq, or AI gateway
4. **Incident runbooks** — no documented procedures for common failure modes
5. **Alert thresholds** — no defined SLOs or alert criteria

---

## Tasks

### 1. Add Structured JSON Logging

Create `apps/core/config/initializers/structured_logging.rb`:

```ruby
if Rails.env.production?
  Rails.application.configure do
    config.log_formatter = proc do |severity, time, _progname, msg|
      JSON.dump(
        timestamp: time.utc.iso8601(3),
        level: severity,
        message: msg,
        service: "k12-core",
        environment: Rails.env,
      ) + "\n"
    end
  end
end
```

Add request context (tenant_id, user_id, request_id) to log tags:
```ruby
config.log_tags = [
  :request_id,
  -> (req) { "tenant:#{req.env['current_tenant_id']}" },
]
```

### 2. Create MetricsService

Create `apps/core/app/services/metrics_service.rb`:

```ruby
class MetricsService
  def self.increment(metric, tags: {})
    Rails.logger.info({ metric: metric, type: "counter", tags: tags }.to_json)
    # Future: StatsD.increment(metric, tags: tags.map { |k,v| "#{k}:#{v}" })
  end

  def self.timing(metric, duration_ms, tags: {})
    Rails.logger.info({ metric: metric, type: "timing", value: duration_ms, tags: tags }.to_json)
  end

  def self.gauge(metric, value, tags: {})
    Rails.logger.info({ metric: metric, type: "gauge", value: value, tags: tags }.to_json)
  end
end
```

Instrument key paths:
- API request count/duration (via RequestTiming middleware)
- Background job execution count/duration/failure
- AI invocation count/latency/token usage
- Sync operation count/success/failure
- Authentication success/failure

### 3. Enhance Health Check

Update `apps/core/app/controllers/health_controller.rb`:

```ruby
def show
  checks = {
    database: check_database,
    redis: check_redis,
    sidekiq: check_sidekiq,
    ai_gateway: check_ai_gateway,
    migrations: check_migrations,
  }
  status = checks.values.all? { |c| c[:status] == "ok" } ? :ok : :service_unavailable
  render json: { status: status == :ok ? "healthy" : "degraded", checks: checks }, status: status
end
```

### 4. Add Job Instrumentation Concern

Create `apps/core/app/jobs/concerns/instrumented.rb`:

```ruby
module Instrumented
  extend ActiveSupport::Concern

  included do
    around_perform do |job, block|
      start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      block.call
      duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(1)
      MetricsService.timing("job.duration", duration, tags: { job: job.class.name })
      MetricsService.increment("job.completed", tags: { job: job.class.name })
    rescue => e
      MetricsService.increment("job.failed", tags: { job: job.class.name, error: e.class.name })
      raise
    end
  end
end
```

Include in `ApplicationJob`.

### 5. Create Incident Runbooks

Create `docs/runbooks/`:

**sync-failure.md** — Google Classroom / OneRoster sync failures:
- Check sync_runs table for failed status
- Review sync_logs for error details
- Common causes: expired OAuth tokens, rate limits, schema changes
- Recovery: refresh tokens, retry job, check integration_config

**ai-gateway-errors.md** — AI gateway failures:
- Check AI gateway health: GET /v1/health
- Review ai_invocations with error status
- Common causes: provider API key expired, rate limit, safety filter
- Recovery: verify provider config, check token limits

**database-issues.md** — Connection pool exhaustion, slow queries:
- Check connection pool status
- Review slow query log
- Common causes: N+1 regression, missing index, long transaction
- Recovery: kill long queries, add index, increase pool

**deployment-rollback.md** — Failed deployment:
- Check smoke test results
- Review deployment logs
- Rollback procedure via Railway CLI
- Post-mortem template

**auth-failures.md** — Authentication/session issues:
- Check SAML IdP configuration
- Verify OAuth credentials
- Review session cookie settings
- Common causes: certificate expiry, clock skew, cookie domain mismatch

### 6. Define Alert Thresholds

Create `docs/runbooks/alert-thresholds.md`:

| Metric | Warning | Critical | Runbook |
|--------|---------|----------|---------|
| API p95 latency | > 500ms | > 2000ms | database-issues.md |
| API error rate (5xx) | > 1% | > 5% | deployment-rollback.md |
| Job failure rate | > 5% | > 20% | sync-failure.md |
| AI gateway latency | > 5s | > 30s | ai-gateway-errors.md |
| Auth failure rate | > 10% | > 50% | auth-failures.md |
| Database connections | > 80% pool | > 95% pool | database-issues.md |

### 7. Add Tests

- `apps/core/spec/services/metrics_service_spec.rb`
- Update `apps/core/spec/requests/health_spec.rb`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/config/initializers/structured_logging.rb` | JSON log format |
| `apps/core/app/services/metrics_service.rb` | Metric recording |
| `apps/core/app/jobs/concerns/instrumented.rb` | Job instrumentation |
| `docs/runbooks/sync-failure.md` | Sync troubleshooting |
| `docs/runbooks/ai-gateway-errors.md` | AI troubleshooting |
| `docs/runbooks/database-issues.md` | DB troubleshooting |
| `docs/runbooks/deployment-rollback.md` | Rollback procedures |
| `docs/runbooks/auth-failures.md` | Auth troubleshooting |
| `docs/runbooks/alert-thresholds.md` | SLO definitions |
| `apps/core/spec/services/metrics_service_spec.rb` | Service spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/health_controller.rb` | Deep health checks |
| `apps/core/app/jobs/application_job.rb` | Include Instrumented concern |
| `apps/core/app/middleware/request_timing.rb` | Add MetricsService calls |

---

## Definition of Done

- [ ] Structured JSON logging in production
- [ ] Request context (tenant, user, request_id) in log tags
- [ ] MetricsService records counters, timings, and gauges
- [ ] Health check validates DB, Redis, Sidekiq, AI gateway, migrations
- [ ] Job instrumentation tracks duration and failures
- [ ] 5 incident runbooks documented
- [ ] Alert thresholds defined with runbook links
- [ ] All specs pass
