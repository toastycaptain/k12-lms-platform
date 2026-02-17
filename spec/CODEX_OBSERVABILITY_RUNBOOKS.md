# CODEX_OBSERVABILITY_RUNBOOKS — Dashboards, Alerts, and Incident Runbooks

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.11 (Security & Observability), PRD-23 (Reliability, Observability)
**Depends on:** CODEX_PRODUCTION_ENVIRONMENT

---

## Problem

The platform has Sentry error tracking configured, but lacks:

1. **Structured logging** — Rails logs are unstructured text, hard to query in production
2. **Metrics collection** — No application-level metrics (request latency, job duration, AI invocation counts)
3. **Alert thresholds** — No automated alerts for error spikes, slow responses, or job queue depth
4. **Runbooks** — No documented procedures for common incidents (sync failures, AI gateway errors, database issues)
5. **Dashboard definitions** — No pre-built dashboards for operational monitoring

---

## Tasks

### 1. Structured JSON Logging (Rails)

Update `apps/core/config/environments/production.rb`:

```ruby
config.log_formatter = ::Logger::Formatter.new
config.logger = ActiveSupport::TaggedLogging.logger(
  $stdout,
  formatter: ->(severity, timestamp, _progname, msg) {
    JSON.generate(
      timestamp: timestamp.iso8601(3),
      level: severity,
      message: msg,
      service: "k12-core",
      environment: Rails.env,
    ) + "\n"
  }
)
```

Add request logging middleware that emits structured JSON with:
- `request_id`, `method`, `path`, `status`, `duration_ms`
- `user_id`, `tenant_id` (from Current attributes)
- `controller`, `action`

### 2. Application Metrics via StatsD/Prometheus

Add lightweight metrics collection. Since Railway supports log-based metrics, use structured log events:

Create `apps/core/app/services/metrics_service.rb`:

```ruby
class MetricsService
  def self.emit(event, tags = {})
    Rails.logger.info(
      JSON.generate(
        metric: event,
        tags: tags,
        timestamp: Time.current.iso8601(3),
        service: "k12-core",
      )
    )
  end
end
```

Instrument key paths:
- `api.request` — every API request (duration, status, controller)
- `job.completed` — every Sidekiq job (duration, job class, status)
- `ai.invocation` — every AI generation (provider, model, tokens, duration)
- `sync.run` — every integration sync (provider, status, record count)
- `auth.login` — every authentication event (provider, status)

### 3. Sidekiq Job Monitoring

Add `apps/core/app/jobs/concerns/job_instrumentation.rb`:

```ruby
module JobInstrumentation
  extend ActiveSupport::Concern

  included do
    around_perform do |job, block|
      start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      begin
        block.call
        MetricsService.emit("job.completed", {
          job_class: job.class.name,
          status: "success",
          duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round,
        })
      rescue => e
        MetricsService.emit("job.completed", {
          job_class: job.class.name,
          status: "error",
          error: e.class.name,
          duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round,
        })
        raise
      end
    end
  end
end
```

Include in `ApplicationJob`:
```ruby
class ApplicationJob < ActiveJob::Base
  include JobInstrumentation
end
```

### 4. AI Gateway Metrics

Update `apps/ai-gateway/app/main.py` request logging middleware to emit structured metrics:

```python
{
    "metric": "ai.request",
    "provider": provider_name,
    "model": model_name,
    "tokens": total_tokens,
    "duration_ms": duration,
    "status": "success" | "error",
    "task_type": task_type,
}
```

### 5. Create Incident Runbooks

Create `docs/runbooks/` directory with these runbooks:

#### `docs/runbooks/SYNC_FAILURE.md`
- **Symptoms:** ClassroomCourseSyncJob or OneRosterOrgSyncJob failures in Sidekiq
- **Investigation steps:**
  1. Check Sidekiq dashboard for job errors
  2. Check SyncLog records: `SyncLog.where(status: "error").order(created_at: :desc).limit(10)`
  3. Verify IntegrationConfig credentials are valid
  4. Check Google API status / OneRoster endpoint availability
- **Resolution:** Re-queue failed jobs, refresh OAuth tokens, contact provider
- **Escalation:** If > 10 failures in 1 hour, alert team lead

#### `docs/runbooks/AI_GATEWAY_ERRORS.md`
- **Symptoms:** AI generation failures, streaming errors, or gateway 5xx responses
- **Investigation steps:**
  1. Check AI Gateway health: `GET /v1/health`
  2. Check provider API status (OpenAI, Anthropic)
  3. Review AI Gateway logs for ProviderError details
  4. Check AiInvocation records: `AiInvocation.where(status: "failed").order(created_at: :desc).limit(10)`
- **Resolution:** Verify API keys, check rate limits, switch provider
- **Escalation:** If all providers failing, disable AI features via admin panel

#### `docs/runbooks/DATABASE_ISSUES.md`
- **Symptoms:** Slow queries, connection pool exhaustion, migration failures
- **Investigation steps:**
  1. Check `pg_stat_activity` for long-running queries
  2. Check connection pool: `ActiveRecord::Base.connection_pool.stat`
  3. Check for lock contention: `SELECT * FROM pg_locks WHERE NOT granted`
  4. Check disk usage and vacuum status
- **Resolution:** Kill long queries, run VACUUM ANALYZE, increase pool size
- **Escalation:** If data loss risk, follow `docs/DATABASE_BACKUP.md` restore procedure

#### `docs/runbooks/DEPLOYMENT_ROLLBACK.md`
- **Symptoms:** Post-deploy errors, smoke test failures, user reports
- **Investigation steps:**
  1. Check Railway deploy logs
  2. Run smoke tests: `scripts/smoke-test.sh $CORE_URL $WEB_URL`
  3. Check Sentry for new error spikes
- **Resolution:** Railway rollback to previous deploy
- **Escalation:** If database migration is irreversible, use backup restore

#### `docs/runbooks/AUTH_FAILURES.md`
- **Symptoms:** Users can't log in, OAuth callback errors, CSRF rejections
- **Investigation steps:**
  1. Check CSRF token endpoint: `GET /api/v1/csrf`
  2. Check session cookie configuration
  3. Check CORS_ORIGINS environment variable
  4. Check Google OAuth credentials
  5. Check SAML metadata endpoint
- **Resolution:** Verify credentials, check CORS, clear user cookies

### 6. Create Alert Definitions

Create `docs/ALERT_THRESHOLDS.md`:

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | > 5% 5xx responses in 5 min | Critical | Check runbooks, consider rollback |
| Slow Responses | p95 latency > 2s for 5 min | Warning | Investigate slow queries |
| Job Queue Depth | > 100 pending jobs for 10 min | Warning | Check Sidekiq, scale workers |
| AI Gateway Down | Health check fails 3x | Critical | Check provider status |
| Sync Failures | > 5 sync errors in 1 hour | Warning | Check integration configs |
| Disk Usage | > 80% database disk | Warning | Run VACUUM, archive old data |
| Auth Failures | > 20 failed logins in 5 min | Warning | Check for brute force, verify OAuth |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/metrics_service.rb` | Structured metric emission |
| `apps/core/app/jobs/concerns/job_instrumentation.rb` | Job duration/status metrics |
| `docs/runbooks/SYNC_FAILURE.md` | Sync failure runbook |
| `docs/runbooks/AI_GATEWAY_ERRORS.md` | AI gateway error runbook |
| `docs/runbooks/DATABASE_ISSUES.md` | Database troubleshooting runbook |
| `docs/runbooks/DEPLOYMENT_ROLLBACK.md` | Deployment rollback runbook |
| `docs/runbooks/AUTH_FAILURES.md` | Auth failure runbook |
| `docs/ALERT_THRESHOLDS.md` | Alert threshold definitions |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/environments/production.rb` | Structured JSON logging |
| `apps/core/app/jobs/application_job.rb` | Include JobInstrumentation |
| `apps/ai-gateway/app/main.py` | Structured AI metrics |

---

## Definition of Done

- [ ] Rails production logs emit structured JSON
- [ ] MetricsService emits events for API requests, jobs, AI invocations, syncs, auth
- [ ] All 12 background jobs instrumented via JobInstrumentation concern
- [ ] AI Gateway emits structured request metrics
- [ ] 5 incident runbooks created in `docs/runbooks/`
- [ ] Alert threshold document created
- [ ] All existing tests pass
- [ ] No Rubocop violations
