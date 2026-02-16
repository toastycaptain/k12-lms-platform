# Codex Instructions — Production Bootstrap Tooling

## Objective

Create production bootstrap tooling for the K-12 LMS platform deployed on Railway with Supabase PostgreSQL and Redis. The platform currently has development seeds (`db/seeds.rb`, 269 lines) but lacks production-safe initialization, environment validation, encryption key management, and enhanced health checks. This task creates idempotent rake tasks, re-enables Active Record Encryption, enhances the health endpoint, and adds startup environment validation.

---

## What Already Exists (DO NOT recreate)

### Database & Seeds
- `apps/core/db/seeds.rb` — development/demo seed data (269 lines), uses `find_or_create_by!` pattern
- 61 migrations in `apps/core/db/migrate/`
- All models use `TenantScoped` concern (except `Tenant` itself)
- `Current.tenant` must be set before creating scoped records
- `User#add_role(role_name)` — idempotent role assignment

### Models Referenced
- `Tenant` — fields: name, slug (unique), settings (jsonb). Top-level entity, no TenantScoped.
- `School` — fields: name, address, timezone, tenant_id. Includes TenantScoped.
- `User` — fields: email, first_name, last_name, tenant_id. Email unique within tenant scope.
- `Role` — fields: name, tenant_id. Valid names: admin, curriculum_lead, teacher, student, guardian.
- `AcademicYear` — fields: name, start_date, end_date, current, tenant_id.
- `Term` — fields: name, start_date, end_date, academic_year_id, tenant_id.
- `AuditLog` — fields: event_type, metadata (jsonb), actor (User, optional), auditable (polymorphic, optional), tenant_id. Immutable (raises on update/destroy).

### Active Record Encryption
- `config/initializers/active_record_encryption.rb` — falls back to test keys when ENV vars missing
- `app/models/integration_config.rb` — line 4: `# encrypts :settings` is commented out with note "Re-enable once encryption keys are provisioned in production"
- `.env.example` already lists the 3 encryption key ENV vars (unpopulated)

### Health Check
- `app/controllers/api/v1/health_controller.rb` — checks database and Redis, returns `{ status, checks }` JSON
- `spec/requests/api/v1/health_spec.rb` — tests for 200 (ok) and 503 (degraded)
- Route: `GET /api/v1/health` (unauthenticated, inherits from `ActionController::API`)
- Also: `GET /up` mapped to `rails/health#show` (Rails default)

### LTI Keys
- `config/initializers/lti_keys.rb` — graceful degradation pattern: uses ENV in production, auto-generates in dev/test, logs warning if missing

### Rake Tasks
- `apps/core/lib/tasks/` — empty (only `.keep`)

### Infrastructure
- Deployed on Railway with Supabase PostgreSQL and Redis
- Sidekiq for background jobs
- `REDIS_URL` ENV var used for both Redis and Sidekiq

---

## Task 1: Production Bootstrap Rake Task

**Create:** `apps/core/lib/tasks/production_bootstrap.rake`

This file will contain all production namespace rake tasks (Tasks 1, 2, and the encryption key generator from Task 3).

### `rails production:bootstrap`

An idempotent task that creates the minimum records needed for a working production instance.

```ruby
namespace :production do
  desc "Bootstrap production with initial tenant, admin user, school, and academic year"
  task bootstrap: :environment do
    require "securerandom"

    admin_email = ENV.fetch("ADMIN_EMAIL") do
      abort "ERROR: ADMIN_EMAIL environment variable is required. Set it and re-run."
    end

    tenant_slug = ENV.fetch("DEFAULT_TENANT_SLUG", "default")

    ActiveRecord::Base.transaction do
      # --- Tenant ---
      tenant = Tenant.find_or_create_by!(slug: tenant_slug) do |t|
        t.name = tenant_slug.titleize
        t.settings = {}
      end
      Current.tenant = tenant

      # --- Admin User ---
      admin = User.find_or_create_by!(email: admin_email, tenant: tenant) do |u|
        u.first_name = "Admin"
        u.last_name = "User"
      end
      admin.add_role(:admin)

      # --- Default School ---
      school = School.find_or_create_by!(name: "Default School", tenant: tenant) do |s|
        s.address = ""
        s.timezone = "America/Chicago"
      end

      # --- Academic Year (current calendar year) ---
      current_year = Date.current.year
      year_name = "#{current_year}-#{current_year + 1}"
      academic_year = AcademicYear.find_or_create_by!(name: year_name, tenant: tenant) do |ay|
        ay.start_date = Date.new(current_year, 8, 1)
        ay.end_date = Date.new(current_year + 1, 6, 30)
        ay.current = true
      end

      # --- Default Term (full year) ---
      term = Term.find_or_create_by!(name: "Full Year #{year_name}", tenant: tenant, academic_year: academic_year) do |t|
        t.start_date = academic_year.start_date
        t.end_date = academic_year.end_date
      end

      # --- Audit Log ---
      AuditLog.create!(
        event_type: "system.bootstrap",
        metadata: {
          version: `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown",
          timestamp: Time.current.iso8601,
          admin_email: admin_email,
          tenant_slug: tenant_slug
        },
        actor: admin,
        auditable: tenant,
        tenant: tenant
      )

      # --- Summary ---
      puts ""
      puts "=== Production Bootstrap Complete ==="
      puts "  Tenant:        #{tenant.name} (#{tenant.slug}) [#{tenant.persisted? ? 'found' : 'created'}]"
      puts "  Admin:         #{admin.email} [#{admin.previously_new_record? ? 'created' : 'found'}]"
      puts "  Admin roles:   #{admin.roles.pluck(:name).join(', ')}"
      puts "  School:        #{school.name} [#{school.previously_new_record? ? 'created' : 'found'}]"
      puts "  Academic Year: #{academic_year.name} [#{academic_year.previously_new_record? ? 'created' : 'found'}]"
      puts "  Term:          #{term.name} [#{term.previously_new_record? ? 'created' : 'found'}]"
      puts "  Audit log:     system.bootstrap entry recorded"
      puts "====================================="
      puts ""
    ensure
      Current.tenant = nil
    end
  end
end
```

**Key behaviors:**
- Aborts immediately if `ADMIN_EMAIL` is not set (required)
- Uses `ENV['DEFAULT_TENANT_SLUG']` with fallback to `"default"`
- All records use `find_or_create_by!` for idempotency
- Sets `Current.tenant` before creating scoped records, clears it in `ensure`
- Wrapped in `ActiveRecord::Base.transaction` so partial failures roll back
- Creates an `AuditLog` entry with `event_type: "system.bootstrap"` on every run (Task 6)
- Prints a human-readable summary (never prints secrets)
- The summary indicates whether each record was found or created using `previously_new_record?`
- Safe to run multiple times: second run finds all existing records and only adds a new audit log entry

---

## Task 2: Migration Status Check Rake Task

Add to the same file: `apps/core/lib/tasks/production_bootstrap.rake`

### `rails production:check_migrations`

```ruby
namespace :production do
  desc "Check that all migrations have been applied; exit 1 if any are pending"
  task check_migrations: :environment do
    context = ActiveRecord::Base.connection.migration_context
    pending = context.migrations.reject { |m| context.get_all_versions.include?(m.version) }

    if pending.empty?
      puts "All #{context.get_all_versions.size} migrations have been applied."
      exit 0
    else
      puts "ERROR: #{pending.size} pending migration(s):"
      pending.each do |migration|
        puts "  - #{migration.version} #{migration.name}"
      end
      puts ""
      puts "Run 'rails db:migrate' to apply them."
      exit 1
    end
  end
end
```

**Key behaviors:**
- Lists all pending migrations by version and name
- Exits with status 0 if all applied, status 1 if any are pending
- Can be used in CI/CD pipelines to gate deployments: `rails production:check_migrations || exit 1`
- Does not attempt to run migrations itself

---

## Task 3: Re-enable Active Record Encryption

### 3a. Uncomment `encrypts :settings`

**Modify:** `apps/core/app/models/integration_config.rb`

Replace line 4:
```ruby
  # encrypts :settings — requires ACTIVE_RECORD_ENCRYPTION_* env vars to be configured
  # Re-enable once encryption keys are provisioned in production
```

With:
```ruby
  encrypts :settings
```

### 3b. Update encryption initializer

**Modify:** `apps/core/config/initializers/active_record_encryption.rb`

Replace the entire file with:

```ruby
# Active Record Encryption configuration
#
# In production, real encryption keys MUST be set via environment variables.
# In development/test, fallback keys are used automatically.
#
# Generate keys with: rails production:generate_encryption_keys

ENCRYPTION_KEYS = %w[
  ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY
  ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY
  ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT
].freeze

if Rails.env.production?
  missing = ENCRYPTION_KEYS.select { |key| ENV[key].blank? }

  if missing.any?
    Rails.logger.warn(
      "WARNING: Missing Active Record Encryption keys: #{missing.join(', ')}. " \
      "Encrypted columns will not work correctly. " \
      "Generate keys with: rails production:generate_encryption_keys"
    )
  end
end

Rails.application.configure do
  if Rails.env.production?
    config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"].presence
    config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"].presence
    config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"].presence
  else
    # Development/test fallback keys — NOT suitable for production
    config.active_record.encryption.primary_key = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY",
      "test-primary-key-that-is-long-enough"
    )
    config.active_record.encryption.deterministic_key = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY",
      "test-deterministic-key-long-enough"
    )
    config.active_record.encryption.key_derivation_salt = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT",
      "test-key-derivation-salt-long-en"
    )
  end
end
```

**Key behaviors:**
- In production: uses only real ENV values. If any key is missing, logs a warning but does NOT crash the app.
- In development/test: falls back to hardcoded test keys (preserving current behavior).
- The `.presence` call ensures blank strings are treated as nil rather than used as keys.

### 3c. Encryption key generator rake task

Add to `apps/core/lib/tasks/production_bootstrap.rake`:

```ruby
namespace :production do
  desc "Generate the 3 Active Record Encryption keys (output only, does not write to ENV)"
  task generate_encryption_keys: :environment do
    require "securerandom"

    puts ""
    puts "=== Active Record Encryption Keys ==="
    puts ""
    puts "Add these to your Railway environment variables (or .env file):"
    puts ""
    puts "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=#{SecureRandom.hex(32)}"
    puts "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=#{SecureRandom.hex(32)}"
    puts "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=#{SecureRandom.hex(32)}"
    puts ""
    puts "WARNING: Store these securely. If you lose them, encrypted data cannot be decrypted."
    puts "WARNING: Do not commit these values to version control."
    puts "====================================="
    puts ""
  end
end
```

### 3d. Update .env.example

**Modify:** `apps/core/.env.example`

Replace the Active Record Encryption section:
```env
# Active Record Encryption
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=
```

With:
```env
# Active Record Encryption (REQUIRED in production)
# Generate all 3 keys with: bundle exec rails production:generate_encryption_keys
# These keys encrypt sensitive columns (e.g., IntegrationConfig#settings).
# If lost, encrypted data cannot be recovered.
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=
```

---

## Task 4: Health Check Enhancement

**Modify:** `apps/core/app/controllers/api/v1/health_controller.rb`

Replace the entire file with:

```ruby
class Api::V1::HealthController < ActionController::API
  def show
    checks = {
      database: check_component { database_check! },
      redis: check_component { redis_check! },
      sidekiq: sidekiq_status
    }

    critical_ok = checks[:database][:status] == "connected" &&
                  checks[:redis][:status] == "connected"

    http_status = critical_ok ? :ok : :service_unavailable

    render json: {
      status: critical_ok ? "ok" : "degraded",
      database: checks[:database][:status],
      redis: checks[:redis][:status],
      sidekiq: checks[:sidekiq],
      version: git_version,
      rails_env: Rails.env
    }, status: http_status
  end

  private

  def check_component
    yield
    { status: "connected" }
  rescue StandardError => e
    { status: "error", message: e.message }
  end

  def database_check!
    ActiveRecord::Base.connection.execute("SELECT 1")
  end

  def redis_check!
    if defined?(Redis)
      redis = Redis.new(url: ENV["REDIS_URL"])
      redis.ping
    else
      redis_client = RedisClient.config(url: ENV["REDIS_URL"]).new_client
      redis_client.call("PING")
    end
  end

  def sidekiq_status
    if defined?(Sidekiq::Queue)
      queues = Sidekiq::Queue.all.map { |q| { name: q.name, size: q.size } }
      { queues: queues }
    else
      { queues: [], note: "Sidekiq not loaded" }
    end
  rescue StandardError => e
    { queues: [], error: e.message }
  end

  def git_version
    @git_version ||= ENV.fetch("GIT_SHA") do
      `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown"
    end
  end
end
```

**Key changes from existing health controller:**
- Adds `sidekiq` check with queue names and sizes
- Adds `version` field (from `GIT_SHA` ENV or git command)
- Adds `rails_env` field
- Response format changes from `{ status, checks: { database, redis } }` to flat `{ status, database, redis, sidekiq, version, rails_env }`
- Database and Redis status values change from `"ok"` to `"connected"` for clarity
- Returns 503 only when critical checks (database, redis) fail — Sidekiq issues are informational

**Important:** The existing spec at `spec/requests/api/v1/health_spec.rb` tests the old response format. You MUST update the spec to match the new format. See Task 7 below.

---

## Task 5: Environment Variable Validation

**Create:** `apps/core/config/initializers/env_validation.rb`

```ruby
# Environment variable validation — runs on boot
#
# Required vars cause a logged warning in production (does not crash).
# Recommended vars cause a logged info message if missing.
# A startup summary is always logged.

Rails.application.config.after_initialize do
  next if Rails.env.test? && !ENV["VALIDATE_ENV_IN_TEST"]

  logger = Rails.logger || Logger.new($stdout)

  # --- Required in production ---
  required_vars = %w[DATABASE_URL REDIS_URL SECRET_KEY_BASE]

  if Rails.env.production?
    missing_required = required_vars.select { |var| ENV[var].blank? }
    if missing_required.any?
      logger.warn(
        "PRODUCTION WARNING: Missing required environment variables: #{missing_required.join(', ')}. " \
        "The application may not function correctly."
      )
    end
  end

  # --- Recommended (all environments) ---
  recommended_vars = %w[SENTRY_DSN CORS_ORIGINS FRONTEND_URL]
  missing_recommended = recommended_vars.select { |var| ENV[var].blank? }
  if missing_recommended.any? && !Rails.env.test?
    logger.info(
      "Missing recommended environment variables: #{missing_recommended.join(', ')}. " \
      "These are optional but improve observability and security."
    )
  end

  # --- Startup summary ---
  unless Rails.env.test?
    tenant_count = begin
      Tenant.unscoped.count
    rescue StandardError
      "N/A"
    end
    user_count = begin
      User.unscoped.count
    rescue StandardError
      "N/A"
    end

    logger.info(
      "K-12 LMS booting: RAILS_ENV=#{Rails.env}, tenant_count=#{tenant_count}, user_count=#{user_count}"
    )
  end
end
```

**Key behaviors:**
- Runs in `after_initialize` callback so database is available for counts
- Skips entirely in test environment unless `VALIDATE_ENV_IN_TEST` is set (avoids noisy test output)
- `RAILS_ENV` is not checked as a required var because it is always set by Rails itself
- Required var checks only warn in production (never crash)
- Recommended var checks log at `info` level in non-test environments
- Startup summary logs tenant and user counts (wrapped in rescue for fresh deploys before migration)
- Never logs the values of environment variables (only their names)

---

## Task 6: Audit Log on Bootstrap

This is integrated into Task 1 above. Every time `rails production:bootstrap` runs, an `AuditLog` entry is created with:

```ruby
AuditLog.create!(
  event_type: "system.bootstrap",
  metadata: {
    version: `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown",
    timestamp: Time.current.iso8601,
    admin_email: admin_email,
    tenant_slug: tenant_slug
  },
  actor: admin,
  auditable: tenant,
  tenant: tenant
)
```

This provides an audit trail of every bootstrap execution. Since `AuditLog` is immutable (raises on update/destroy), the trail cannot be tampered with. Subsequent bootstrap runs will add new audit entries (not update existing ones).

---

## Task 7: Verify

### Update existing health spec

**Modify:** `apps/core/spec/requests/api/v1/health_spec.rb`

Replace the entire file with:

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Health", type: :request do
  before { Current.tenant = nil }
  after { Current.tenant = nil }

  describe "GET /api/v1/health" do
    it "returns ok when all critical checks pass" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_return(true)

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("ok")
      expect(body["database"]).to eq("connected")
      expect(body["redis"]).to eq("connected")
      expect(body["rails_env"]).to eq("test")
      expect(body).to have_key("version")
      expect(body).to have_key("sidekiq")
    end

    it "returns service unavailable when database check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_raise(StandardError, "db unavailable")

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body["database"]).to eq("error")
    end

    it "returns service unavailable when redis check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_raise(StandardError, "redis down")

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body["redis"]).to eq("error")
    end

    it "includes sidekiq queue information" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_return(true)

      get "/api/v1/health"

      body = JSON.parse(response.body)
      expect(body["sidekiq"]).to have_key("queues")
    end
  end
end
```

### Run verification commands

After implementing all tasks, run the following from `apps/core/`:

```bash
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"

# 1. Verify bootstrap task runs (in test env)
ADMIN_EMAIL=test@example.com RAILS_ENV=test bundle exec rails production:bootstrap

# 2. Verify migration check works
bundle exec rails production:check_migrations

# 3. Verify encryption key generator outputs keys
bundle exec rails production:generate_encryption_keys

# 4. Run all specs (including updated health spec)
bundle exec rspec

# 5. Run rubocop
bundle exec rubocop

# 6. Verify env validation initializer loads without error
bundle exec rails runner "puts 'Initializer loaded OK'"
```

---

## Architecture Rules

1. **Idempotency**: All rake tasks MUST be safe to run multiple times. Use `find_or_create_by!` for record creation. Never assume the database is empty.
2. **No secrets in logs**: Never output ENV values, passwords, tokens, or encryption keys to logs or stdout. Only output variable names when reporting missing vars.
3. **Tenant scoping**: Set `Current.tenant` before creating any scoped records. Always clear it in an `ensure` block.
4. **Transaction safety**: Wrap multi-record operations in `ActiveRecord::Base.transaction` so partial failures roll back cleanly.
5. **Non-destructive**: Never delete or modify existing data. Bootstrap only creates records if they do not exist.
6. **Do NOT modify existing specs**: Only modify `spec/requests/api/v1/health_spec.rb` because the response format changes. All other existing specs must pass unmodified.
7. **Do NOT add new gems**: All required functionality is available from Rails, SecureRandom, and the existing Gemfile.
8. **Graceful degradation**: Missing ENV vars log warnings but never crash the application. Follow the pattern established in `config/initializers/lti_keys.rb`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/lib/tasks/production_bootstrap.rake` | All `production:*` rake tasks |
| `apps/core/config/initializers/env_validation.rb` | Startup ENV validation and summary |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/app/models/integration_config.rb` | Uncomment `encrypts :settings` (remove comment, add `encrypts :settings`) |
| `apps/core/config/initializers/active_record_encryption.rb` | Require real keys in production, keep fallbacks in dev/test |
| `apps/core/app/controllers/api/v1/health_controller.rb` | Add sidekiq, version, rails_env to response |
| `apps/core/.env.example` | Add generation instructions for encryption keys |
| `apps/core/spec/requests/api/v1/health_spec.rb` | Update to match new response format |

## Files NOT to Touch

- `apps/core/db/seeds.rb` — development seeds remain unchanged
- `apps/core/db/migrate/*` — no new migrations needed
- All other existing spec files — must pass unmodified
- `apps/core/config/routes.rb` — health route already exists
- `apps/core/app/models/audit_log.rb` — model already has needed fields

---

## Testing

```bash
cd apps/core
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rails db:migrate
bundle exec rubocop --autocorrect
bundle exec rspec
```

Additionally test each rake task:
```bash
ADMIN_EMAIL=test@example.com bundle exec rails production:bootstrap
bundle exec rails production:check_migrations
bundle exec rails production:generate_encryption_keys
```

---

## Definition of Done

- [ ] `lib/tasks/production_bootstrap.rake` exists with all three tasks
- [ ] `rails production:bootstrap` creates tenant, admin, school, academic year, term, and audit log entry
- [ ] `rails production:bootstrap` aborts with clear error if `ADMIN_EMAIL` is not set
- [ ] `rails production:bootstrap` is idempotent (safe to run multiple times, uses `find_or_create_by!`)
- [ ] `rails production:bootstrap` sets `Current.tenant` before creating scoped records and clears it in `ensure`
- [ ] `rails production:bootstrap` wraps all operations in a transaction
- [ ] `rails production:bootstrap` prints summary without any secrets
- [ ] `rails production:bootstrap` creates `AuditLog` with `event_type: "system.bootstrap"` on every run
- [ ] `rails production:check_migrations` lists pending migrations and exits 1 if any exist
- [ ] `rails production:check_migrations` exits 0 when all migrations are applied
- [ ] `rails production:generate_encryption_keys` outputs 3 hex keys using `SecureRandom.hex(32)`
- [ ] `encrypts :settings` is uncommented in `IntegrationConfig` model
- [ ] `active_record_encryption.rb` initializer requires real keys in production (no fallback to test values)
- [ ] `active_record_encryption.rb` logs warning but does NOT crash if keys are missing in production
- [ ] `active_record_encryption.rb` preserves test/dev fallback keys for non-production environments
- [ ] `.env.example` updated with key generation instructions
- [ ] Health endpoint returns `{ status, database, redis, sidekiq, version, rails_env }` JSON
- [ ] Health endpoint returns 503 when database or redis check fails
- [ ] Health endpoint includes Sidekiq queue names and sizes
- [ ] Health endpoint includes git SHA or "unknown" as version
- [ ] `config/initializers/env_validation.rb` checks required vars in production
- [ ] `config/initializers/env_validation.rb` logs warnings for missing recommended vars
- [ ] `config/initializers/env_validation.rb` logs startup summary with tenant/user counts
- [ ] `config/initializers/env_validation.rb` does NOT crash in any environment
- [ ] `config/initializers/env_validation.rb` skips in test environment by default
- [ ] `spec/requests/api/v1/health_spec.rb` updated to match new response format
- [ ] All existing specs pass (`bundle exec rspec`)
- [ ] `bundle exec rubocop` passes
- [ ] No new gems added
- [ ] No secrets output to logs
