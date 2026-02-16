# Codex Instructions — Schema Migration Fixes & CI Gate Completion

## Objective

Fix the 7 migration-less tables in schema.rb, resolve the Ruby version CI blocker, and ensure all three services have full CI test coverage.

**Spec references:** TECH-2.4 (data model), PRD-23 (reliability), Blockers #1 and #5 in BLOCKERS.md

---

## What Already Exists (DO NOT recreate)

### Migrations
- `apps/core/db/migrate/` — 61 migration files exist
- `apps/core/db/schema.rb` — Contains all 60+ tables

### CI Pipeline
- `.github/workflows/ci.yml` — Runs web (lint/typecheck/build/test) and AI gateway (pytest)
- `.github/workflows/deploy.yml` — Railway deployment with smoke tests
- `Makefile` — web-ci, core-ci, ai-ci targets

### Known Blockers (from docs/BLOCKERS.md)
- Blocker #1: Local environments with Ruby < 4.0 cannot run apps/core
- Blocker #5: 7 tables have no matching migration files: `ai_provider_configs`, `ai_task_policies`, `ai_templates`, `ai_invocations`, `lti_registrations`, `lti_resource_links`, `data_retention_policies`

---

## Task 1: Create Missing Migration Files

**Problem:** `schema.rb` has 7 tables that were likely created via `schema.rb` load rather than individual migrations. This causes `rails db:migrate` to fail on fresh databases.

**For each missing table, create a migration file in `apps/core/db/migrate/`:**

Use timestamps that sort after the existing migrations (the latest is `20260215140000`).

**Migration 1:** `20260216000001_create_ai_provider_configs_migration.rb`
```ruby
class CreateAiProviderConfigsMigration < ActiveRecord::Migration[8.0]
  def change
    return if table_exists?(:ai_provider_configs)

    create_table :ai_provider_configs do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :provider_name, null: false
      t.string :display_name, null: false
      t.string :default_model, null: false
      t.string :api_key
      t.string :status, null: false, default: "inactive"
      t.jsonb :available_models, default: []
      t.jsonb :settings, default: {}
      t.timestamps
    end

    add_index :ai_provider_configs, [:tenant_id, :provider_name], unique: true
  end
end
```

**Migration 2:** `20260216000002_create_ai_task_policies_migration.rb`
- Table: `ai_task_policies`
- Columns: tenant_id, created_by_id, ai_provider_config_id, task_type, enabled (boolean), requires_approval (boolean), allowed_roles (jsonb), model_override, temperature_limit (decimal), max_tokens_limit (integer), settings (jsonb)
- Unique index: `[tenant_id, task_type]`

**Migration 3:** `20260216000003_create_ai_templates_migration.rb`
- Table: `ai_templates`
- Columns: tenant_id, created_by_id, task_type, name, status, system_prompt (text), user_prompt_template (text), variables (jsonb)
- Use `table_exists?` guard

**Migration 4:** `20260216000004_create_ai_invocations_migration.rb`
- Table: `ai_invocations`
- Columns: tenant_id, user_id, ai_provider_config_id, ai_task_policy_id (nullable), ai_template_id (nullable), task_type, provider_name, model, status, input_hash (text), prompt_tokens (integer), completion_tokens (integer), total_tokens (integer), duration_ms (integer), context (jsonb), error_message (text), started_at (datetime), completed_at (datetime)
- Use `table_exists?` guard

**Migration 5:** `20260216000005_create_lti_registrations_migration.rb`
- Table: `lti_registrations`
- Columns: tenant_id, created_by_id, client_id, deployment_id, issuer, auth_login_url, auth_token_url, jwks_url, name, description, status, settings (jsonb)
- Unique index: `[tenant_id, client_id]`
- Use `table_exists?` guard

**Migration 6:** `20260216000006_create_lti_resource_links_migration.rb`
- Table: `lti_resource_links`
- Columns: tenant_id, lti_registration_id, course_id, url, title, description, custom_params (jsonb)
- Use `table_exists?` guard

**Migration 7:** `20260216000007_create_data_retention_policies_migration.rb`
- Table: `data_retention_policies`
- Columns: tenant_id, created_by_id, name, entity_type, action, retention_days (integer), enabled (boolean), settings (jsonb)
- Use `table_exists?` guard

**IMPORTANT:** Every migration must use `return if table_exists?(:table_name)` at the top of the `change` method so it's idempotent on environments where the table already exists (created from schema.rb).

**After creating migrations:** Verify `schema.rb` is unchanged by running:
```bash
cd apps/core && bundle exec rails db:migrate:status
```

---

## Task 2: CI Gate for Core RSpec

**File:** `.github/workflows/ci.yml`

**Current state:** CI runs web and AI gateway checks but skips Core RSpec due to Ruby < 4.0 blocker.

**Required changes:**

Add a Ruby job to the CI matrix:

```yaml
  core:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: k12_lms_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
    env:
      RAILS_ENV: test
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/k12_lms_test
      REDIS_URL: redis://localhost:6379/0
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '4.0'
          bundler-cache: true
          working-directory: apps/core
      - name: Setup database
        run: bundle exec rails db:schema:load
        working-directory: apps/core
      - name: Run RSpec
        run: bundle exec rspec --format progress
        working-directory: apps/core
      - name: Run Rubocop
        run: bundle exec rubocop --parallel
        working-directory: apps/core
      - name: Run Brakeman
        run: bundle exec brakeman --quiet --no-pager --exit-on-warn --exit-on-error
        working-directory: apps/core
```

**Note:** GitHub Actions runners may have Ruby 4.0 available via `ruby/setup-ruby`. If not, investigate using a Docker container with the correct Ruby version.

---

## Task 3: Update Makefile

**File:** `Makefile`

**Required changes:**
1. Update `ci` target to include `core-ci`:
   ```makefile
   ci: web-ci core-ci ai-ci
   ```
2. Ensure `core-ci` target runs both rubocop and rspec:
   ```makefile
   core-ci:
   	cd apps/core && bundle exec rubocop --parallel && bundle exec brakeman --quiet --no-pager --exit-on-warn --exit-on-error && bundle exec rspec
   ```

---

## Task 4: Update BLOCKERS.md

**File:** `docs/BLOCKERS.md`

After completing Tasks 1-3, update the blocker statuses:
- Blocker #1: Change to "Mitigated" with note about CI using Ruby 4.0 from setup-ruby action
- Blocker #5: Change to "Resolved" with note that migration files now exist for all tables

---

## Architecture Rules

1. All new migrations MUST use `table_exists?` guards for idempotency
2. Column types and constraints MUST match what's in the current `schema.rb` exactly
3. Do NOT modify existing migration files
4. CI must not break existing web and AI gateway jobs

---

## Testing

```bash
cd apps/core && bundle exec rails db:migrate:status
cd apps/core && bundle exec rspec
```

---

## Definition of Done

- [ ] 7 new migration files created matching schema.rb table definitions
- [ ] All migrations idempotent with `table_exists?` guards
- [ ] `rails db:migrate` succeeds on a fresh database
- [ ] `schema.rb` unchanged after running migrations on existing database
- [ ] CI workflow includes Core RSpec + Rubocop + Brakeman job
- [ ] Makefile `ci` target runs all three services
- [ ] BLOCKERS.md updated with resolved/mitigated statuses
- [ ] All existing tests still pass
