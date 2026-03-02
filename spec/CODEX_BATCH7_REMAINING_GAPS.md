# CODEX_BATCH7_REMAINING_GAPS — All Outstanding Missing Pieces

**Priority:** P0/P1
**Date:** 2026-02-25
**Branch:** `batch7/remaining-gaps`
**Commit Message:** `Batch 7 remaining gaps: counter caches, restore job, admin pages, docker-compose, deploy config`

---

## Overview

This file consolidates every confirmed-missing item from the Batch 7 implementation. All items were verified absent from the codebase on 2026-02-25. Complete them in order — or in parallel where noted.

| # | Gap | From Task | Priority | Type |
|---|-----|-----------|----------|------|
| 1 | Counter cache `belongs_to` on 5 models | Task 2 | P0 | Model changes |
| 2 | `database_restore_job.rb` + spec | Task 3 | P1 | New file |
| 3 | `backup_service.rb` | Task 3 | P1 | New file |
| 4 | Admin health dashboard page | Task 4 | P1 | New frontend page |
| 5 | Admin provisioning page | Task 5 | P1 | New frontend page |
| 6 | `docker-compose.yml` | Task 7 | P1 | New file |
| 7 | Fix `apps/core/config/deploy.yml` stub | Task 7 | P1 | Modify existing |

Gaps 1–3 are Rails-only. Gap 4–5 are Next.js only. Gaps 6–7 are infrastructure. They are independent and may run in parallel.

---

## Before Starting

```bash
# Confirm green baseline
cd apps/core && bundle exec rspec
cd apps/web && npm run typecheck && npm run lint
cd apps/ai-gateway && pytest
```

Do not proceed if any suite is failing.

---

## Gap 1 — Counter Cache `belongs_to` Declarations (Task 2)

**Context:** Migration `20260217000004_add_counter_caches.rb` already added the counter cache columns at the database level. The `belongs_to counter_cache: true` declaration is missing from 5 model files, which means Rails will not auto-increment the columns. Only `discussion_post.rb` and `question.rb` are correctly wired.

**Check before modifying — only add if not already present:**

```bash
grep -n "counter_cache" apps/core/app/models/course.rb
grep -n "counter_cache" apps/core/app/models/discussion.rb
grep -n "counter_cache" apps/core/app/models/quiz.rb
grep -n "counter_cache" apps/core/app/models/enrollment.rb
grep -n "counter_cache" apps/core/app/models/school.rb
```

**For each model where `counter_cache: true` is NOT present, add it to the existing `belongs_to`:**

`apps/core/app/models/course.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

`apps/core/app/models/discussion.rb`:
```ruby
belongs_to :course, counter_cache: true
```

`apps/core/app/models/quiz.rb`:
```ruby
belongs_to :course, counter_cache: true
```

`apps/core/app/models/enrollment.rb`:
```ruby
belongs_to :section, counter_cache: true
```

`apps/core/app/models/school.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

**Note on `user.rb`:** The `User` model scopes tenancy via the `TenantScoped` concern, not a `belongs_to :tenant`. Do NOT add `belongs_to :tenant, counter_cache: true` to `user.rb` — it will cause an association conflict. Skip it.

**Verification:**
```bash
cd apps/core && bundle exec rspec spec/models/counter_cache_spec.rb
```

---

## Gap 2 — DatabaseRestoreJob + Spec (Task 3)

**Context:** `DatabaseBackupJob` and `BackupVerificationJob` exist. There is no on-demand restore job for disaster recovery scenarios. This is distinct from `BackupVerificationJob` (which restores to a temp DB to verify integrity). `DatabaseRestoreJob` performs a full production restore from a named backup.

**File: `apps/core/app/jobs/database_restore_job.rb`**

```ruby
class DatabaseRestoreJob < ApplicationJob
  queue_as :low

  # Performs an on-demand restore from a BackupRecord.
  # WARNING: This replaces all data in the target database.
  # Only call from admin interfaces with explicit confirmation.
  #
  # Usage:
  #   DatabaseRestoreJob.perform_later(backup_record_id: 42)
  #   DatabaseRestoreJob.perform_later(backup_record_id: 42, target_database: "k12_restore_test")
  def perform(backup_record_id:, target_database: nil)
    record = BackupRecord.find(backup_record_id)

    unless record.status.in?(%w[completed verified])
      Rails.logger.error("[Restore] Backup #{backup_record_id} has status '#{record.status}' — only completed/verified backups can be restored")
      return
    end

    target_db = target_database || ActiveRecord::Base.connection_db_config.configuration_hash[:database]

    Rails.logger.warn("[Restore] Starting restore of backup #{record.id} (#{record.s3_key}) into '#{target_db}'")

    local_path = nil

    begin
      # 1. Download from S3
      local_path = download_from_s3(record.s3_key, record.s3_bucket)

      # 2. Restore into target database
      restore_to_database(local_path, target_db)

      Rails.logger.info("[Restore] Restore of backup #{record.id} into '#{target_db}' completed successfully")

    rescue => e
      Rails.logger.error("[Restore] Restore of backup #{record.id} failed: #{e.message}")
      raise
    ensure
      File.delete(local_path) if local_path && File.exist?(local_path)
    end
  end

  private

  def download_from_s3(s3_key, s3_bucket)
    require "aws-sdk-s3"
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
    host_flag = config[:host] ? "-h #{Shellwords.escape(config[:host])}" : ""
    port_flag = config[:port] ? "-p #{config[:port]}" : ""
    user_flag = config[:username] ? "-U #{Shellwords.escape(config[:username])}" : ""
    env_prefix = config[:password] ? "PGPASSWORD=#{Shellwords.escape(config[:password])} " : ""

    # Use pg_restore (custom format) or psql (plain SQL)
    cmd = "#{env_prefix}gunzip -c #{Shellwords.escape(local_path.to_s)} | pg_restore #{host_flag} #{port_flag} #{user_flag} -d #{Shellwords.escape(db_name)} --no-owner --no-acl --clean 2>&1"
    output = `#{cmd}`
    Rails.logger.info("[Restore] pg_restore output: #{output.truncate(1000)}")
  end
end
```

**File: `apps/core/spec/jobs/database_restore_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe DatabaseRestoreJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "aborts if backup record status is not completed or verified" do
    record = BackupRecord.create!(
      backup_type: "full",
      status: "failed",
      s3_key: "backups/test.sql.gz",
      s3_bucket: "k12-backups"
    )

    expect(Rails.logger).to receive(:error).with(/has status 'failed'/)
    described_class.perform_now(backup_record_id: record.id)
  end

  it "raises when backup record does not exist" do
    expect {
      described_class.perform_now(backup_record_id: 999_999)
    }.to raise_error(ActiveRecord::RecordNotFound)
  end
end
```

---

## Gap 3 — BackupService Abstraction (Task 3)

**Context:** Backup logic is currently split across `DatabaseBackupJob` and `BackupVerificationJob` with no unified service entry point. `BackupService` provides a thin façade for triggering backups and querying status — used by the admin API and admin UI.

**File: `apps/core/app/services/backup_service.rb`**

```ruby
class BackupService
  # Enqueue a new backup job. Returns the enqueued job or raises on validation error.
  def self.trigger_backup(backup_type: "full")
    unless BackupRecord::VALID_TYPES.include?(backup_type)
      raise ArgumentError, "Invalid backup_type: #{backup_type}. Must be one of: #{BackupRecord::VALID_TYPES.join(', ')}"
    end

    DatabaseBackupJob.perform_later(backup_type: backup_type)
  end

  # Enqueue a restore job for a given BackupRecord ID.
  # Accepts an optional target_database for sandbox restores.
  def self.trigger_restore(backup_record_id:, target_database: nil)
    record = BackupRecord.find(backup_record_id)

    unless record.status.in?(%w[completed verified])
      raise ArgumentError, "Backup #{backup_record_id} is not in a restorable state (status: #{record.status})"
    end

    DatabaseRestoreJob.perform_later(
      backup_record_id: backup_record_id,
      target_database: target_database
    )
  end

  # Returns a status summary hash for admin dashboards.
  def self.status_summary
    {
      total_backups: BackupRecord.count,
      latest_backup: BackupRecord.successful.order(created_at: :desc).first,
      latest_verified: BackupRecord.latest_verified,
      failed_last_30_days: BackupRecord.where(status: "failed")
                                       .where("created_at > ?", 30.days.ago)
                                       .count,
    }
  end
end
```

**File: `apps/core/spec/services/backup_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe BackupService do
  describe ".trigger_backup" do
    it "enqueues DatabaseBackupJob" do
      expect { described_class.trigger_backup }.to have_enqueued_job(DatabaseBackupJob)
    end

    it "raises on invalid backup_type" do
      expect { described_class.trigger_backup(backup_type: "invalid") }.to raise_error(ArgumentError)
    end
  end

  describe ".trigger_restore" do
    it "raises when backup is not in a restorable state" do
      record = BackupRecord.create!(backup_type: "full", status: "failed", s3_key: "t", s3_bucket: "b")
      expect { described_class.trigger_restore(backup_record_id: record.id) }.to raise_error(ArgumentError)
    end

    it "enqueues DatabaseRestoreJob for a completed backup" do
      record = BackupRecord.create!(backup_type: "full", status: "completed", s3_key: "t", s3_bucket: "b")
      expect {
        described_class.trigger_restore(backup_record_id: record.id)
      }.to have_enqueued_job(DatabaseRestoreJob)
    end
  end

  describe ".status_summary" do
    it "returns a hash with the expected keys" do
      summary = described_class.status_summary
      expect(summary).to have_key(:total_backups)
      expect(summary).to have_key(:latest_backup)
      expect(summary).to have_key(:latest_verified)
      expect(summary).to have_key(:failed_last_30_days)
    end
  end
end
```

---

## Gap 4 — Admin Health Dashboard Page (Task 4 Frontend)

**Context:** The backend health API exists at `GET /api/v1/admin/operations/health` and returns `{ overall, checks: { database, redis, sidekiq, storage, ai_gateway }, metrics: { db_connection_pool, db_response_time, sidekiq_queue_depth, ... } }`. The frontend admin section has no health page. Create it.

**File: `apps/web/src/app/admin/health/page.tsx`**

The page must:
- Be located at `apps/web/src/app/admin/health/page.tsx` — accessible at `/admin/health`
- Fetch data from `GET /api/v1/admin/operations/health` using SWR (`useHealth` hook or inline `useSWR`)
- Refresh automatically every 30 seconds (`refreshInterval: 30000` in SWR config)
- Display `overall` status as a color-coded banner: green (healthy), yellow (warning), red (critical)
- Show a card per check: database, redis, sidekiq, storage, ai_gateway — each with status badge and latency
- Show a metrics table: db_connection_pool (%), db_response_time (ms), sidekiq_queue_depth (count), sidekiq_latency (s), memory_usage_percent (%), backup_age_hours (h)
- Show a "Trigger Alert Evaluation" button that calls `POST /api/v1/admin/alert_configurations` — no, just display. No action buttons on this page — it's read-only.
- Show loading skeleton while fetching, error state if fetch fails
- Guard with admin role check — redirect to `/dashboard` if not admin

**SWR hook to use:** `useSWR('/api/v1/admin/operations/health', apiFetch, { refreshInterval: 30000 })`

**TypeScript types needed:**
```typescript
interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  latency_ms?: number;
  error?: string;
  enqueued?: number;
}

interface HealthMetrics {
  db_connection_pool: number;
  db_response_time: number;
  sidekiq_queue_depth: number;
  sidekiq_latency: number;
  memory_usage_percent: number;
  backup_age_hours: number;
}

interface HealthData {
  timestamp: string;
  overall: 'healthy' | 'warning' | 'critical';
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    sidekiq: HealthCheck;
    storage: HealthCheck;
    ai_gateway: HealthCheck;
  };
  metrics: HealthMetrics;
}
```

**Follow existing patterns:** Look at `apps/web/src/app/admin/dashboard/page.tsx` for layout and component import patterns. Use `@k12/ui` components (`Card`, `Badge`, `Spinner`, `Skeleton`) where available.

---

## Gap 5 — Admin Provisioning Page (Task 5 Frontend)

**Context:** The backend provisioning API exists at `POST /api/v1/admin/provisioning` (via `admin/provisioning_controller.rb`). The `TenantProvisioningService`, `OnboardingChecklistService`, and `DataImportService` are all implemented. No admin UI exists to trigger provisioning.

**File: `apps/web/src/app/admin/provisioning/page.tsx`**

The page must:
- Be located at `apps/web/src/app/admin/provisioning/page.tsx` — accessible at `/admin/provisioning`
- Display a "Provision New School" form with fields:
  - School name (required)
  - Admin email (required)
  - Admin first name, last name (required)
  - Subdomain / tenant slug (required)
  - District (optional)
- On submit, `POST /api/v1/admin/provisioning` with the form data
- On success, show a success toast and redirect to `/admin/users` or reset the form
- On error, display the error message from `response.errors`
- Display a table of recently provisioned schools — fetch from `GET /api/v1/admin/schools` or equivalent listing endpoint. If no listing endpoint exists, show a static message "View provisioned schools in the Users section."
- Guard with admin role check — redirect to `/dashboard` if not admin

**API payload shape (matches `TenantProvisioningService`):**
```typescript
interface ProvisionPayload {
  school_name: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  subdomain: string;
  district?: string;
}
```

**Follow existing patterns:** Look at `apps/web/src/app/admin/school/page.tsx` and `apps/web/src/app/admin/users/page.tsx` for form and listing patterns. Use `useSWRMutation` from `@/lib/swr-mutations` for the form submission.

---

## Gap 6 — docker-compose.yml (Task 7)

**Context:** No `docker-compose.yml` exists at the project root. Developers cannot spin up the full stack locally with a single command. Three separate apps (Rails, Next.js, AI Gateway) require PostgreSQL, Redis, and Sidekiq to run.

**File: `docker-compose.yml`** (at project root: `/Users/colinpeterson/k12-lms-platform/docker-compose.yml`)

The compose file must define these services:

| Service | Image / Build | Ports | Depends On |
|---------|---------------|-------|------------|
| `db` | `postgres:16-alpine` | `5432:5432` | — |
| `redis` | `redis:7-alpine` | `6379:6379` | — |
| `core` | `build: apps/core` | `3000:3000` | db, redis |
| `sidekiq` | `build: apps/core` | — | db, redis |
| `web` | `build: apps/web` | `3001:3000` | core |
| `ai_gateway` | `build: apps/ai-gateway` | `8000:8000` | — |

Environment variables:
- `core` and `sidekiq` must receive: `DATABASE_URL`, `REDIS_URL`, `AI_GATEWAY_URL`, `RAILS_ENV=development`
- `web` must receive: `NEXT_PUBLIC_API_URL=http://localhost:3000`, `NODE_ENV=development`
- `ai_gateway` must receive: `ANTHROPIC_API_KEY`, `REDIS_URL`

Volumes:
- `postgres_data` volume for db persistence
- `redis_data` volume for redis persistence

Health checks:
- `db`: `pg_isready -U postgres`
- `redis`: `redis-cli ping`
- `core`: `curl -f http://localhost:3000/api/v1/health || exit 1`

`sidekiq` command override: `bundle exec sidekiq`

The file should use a `.env` file for secrets (`env_file: .env`) rather than hardcoding credentials. Include a comment at the top: `# Local development only. Do not use in production.`

Also create **`.env.example`** at the project root documenting required variables:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/k12_development
REDIS_URL=redis://localhost:6379/0
AI_GATEWAY_URL=http://localhost:8000
ANTHROPIC_API_KEY=your_key_here
BACKUP_S3_BUCKET=k12-backups-dev
BACKUP_S3_REGION=us-east-1
SLACK_ALERT_WEBHOOK_URL=
RAILS_MASTER_KEY=
```

---

## Gap 7 — Fix `apps/core/config/deploy.yml` Stub (Task 7)

**Context:** Kamal `deploy.yml` exists but contains placeholder values (`192.168.0.1`, commented-out SSL/proxy, no database or Redis accessories, no registry credentials). It is not production-ready. Railway is the actual deployment platform (confirmed in `.github/workflows/deploy.yml`), so Kamal may be for future self-hosted fallback — but the config must not contain hardcoded IPs.

**File: `apps/core/config/deploy.yml`**

Replace the current stub. The updated file must:
- Replace `192.168.0.1` with `<%= ENV["DEPLOY_SERVER_IP"] %>` everywhere
- Set `registry.server` to `ghcr.io` (GitHub Container Registry — aligns with existing CI)
- Set `registry.username` to `<%= ENV["GITHUB_ACTOR"] %>`
- Set `registry.password` to use the Kamal secrets file reference: `- KAMAL_REGISTRY_PASSWORD`
- Set `image` to `ghcr.io/<%= ENV["GITHUB_REPOSITORY"] %>/core`
- Add `accessories` section for database and Redis:
  ```yaml
  accessories:
    db:
      image: postgres:16-alpine
      host: <%= ENV["DEPLOY_SERVER_IP"] %>
      env:
        POSTGRES_PASSWORD: <%= ENV["POSTGRES_PASSWORD"] %>
      directories:
        - data:/var/lib/postgresql/data
    redis:
      image: redis:7-alpine
      host: <%= ENV["DEPLOY_SERVER_IP"] %>
      directories:
        - data:/data
  ```
- Add `env.secret` references for all required secrets:
  ```yaml
  env:
    secret:
      - RAILS_MASTER_KEY
      - DATABASE_URL
      - REDIS_URL
      - ANTHROPIC_API_KEY
      - BACKUP_S3_BUCKET
      - BACKUP_S3_REGION
      - AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY
      - SLACK_ALERT_WEBHOOK_URL
  ```
- Add a comment at the top: `# Kamal self-hosted fallback config. Railway is primary deployment target (see .github/workflows/deploy.yml).`

---

## Files to Create

| File | Gap |
|------|-----|
| `apps/core/app/jobs/database_restore_job.rb` | Gap 2 |
| `apps/core/spec/jobs/database_restore_job_spec.rb` | Gap 2 |
| `apps/core/app/services/backup_service.rb` | Gap 3 |
| `apps/core/spec/services/backup_service_spec.rb` | Gap 3 |
| `apps/web/src/app/admin/health/page.tsx` | Gap 4 |
| `apps/web/src/app/admin/provisioning/page.tsx` | Gap 5 |
| `docker-compose.yml` (project root) | Gap 6 |
| `.env.example` (project root) | Gap 6 |

## Files to Modify

| File | Change | Gap |
|------|--------|-----|
| `apps/core/app/models/course.rb` | Add `counter_cache: true` to `belongs_to :tenant` | Gap 1 |
| `apps/core/app/models/discussion.rb` | Add `counter_cache: true` to `belongs_to :course` | Gap 1 |
| `apps/core/app/models/quiz.rb` | Add `counter_cache: true` to `belongs_to :course` | Gap 1 |
| `apps/core/app/models/enrollment.rb` | Add `counter_cache: true` to `belongs_to :section` | Gap 1 |
| `apps/core/app/models/school.rb` | Add `counter_cache: true` to `belongs_to :tenant` | Gap 1 |
| `apps/core/config/deploy.yml` | Replace placeholder IPs and stubs with ENV-driven config | Gap 7 |

---

## Definition of Done

- [ ] `bundle exec rspec spec/models/counter_cache_spec.rb` passes — all 5 missing models now have `counter_cache: true`
- [ ] `apps/core/app/jobs/database_restore_job.rb` exists and spec passes
- [ ] `apps/core/app/services/backup_service.rb` exists and spec passes
- [ ] `apps/web/src/app/admin/health/page.tsx` renders at `/admin/health` — shows system health, auto-refreshes
- [ ] `apps/web/src/app/admin/provisioning/page.tsx` renders at `/admin/provisioning` — provision form works
- [ ] `docker-compose.yml` exists at project root — `docker compose up` starts all 6 services
- [ ] `.env.example` documents all required environment variables
- [ ] `apps/core/config/deploy.yml` has no hardcoded IPs — all values use ENV vars
- [ ] `bundle exec rspec` passes (full suite, 0 failures)
- [ ] `bundle exec rubocop` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

---

## Notes

**Do NOT:**
- Add `belongs_to :tenant, counter_cache: true` to `user.rb` — tenancy is via TenantScoped concern, not `belongs_to`
- Create a `SafetyEvent` model (Rails or Python) — the spec stores safety data in `AiInvocation.metadata` JSONB; `SafetyController` already queries it correctly
- Recreate `DatabaseBackupJob`, `BackupVerificationJob`, or `BackupRecord` — these already exist

**Existing files to reference:**
- `apps/core/app/jobs/database_backup_job.rb` — for S3 download/upload patterns in the restore job
- `apps/core/app/jobs/backup_verification_job.rb` — for pg_restore shell command pattern
- `apps/web/src/app/admin/dashboard/page.tsx` — for admin page layout pattern
- `apps/web/src/lib/swr.ts` — for `apiFetch` and SWR usage
- `apps/web/src/lib/swr-mutations.ts` — for `useSWRMutation` form submission pattern
