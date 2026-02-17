# CODEX_PRODUCTION_ENVIRONMENT — Production Readiness Hardening

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.11 (Security & Observability), PRD-23 (Reliability), TECH-2.3 (Authentication)
**Depends on:** CODEX_MIGRATION_CLEANUP

---

## Problem

The platform deploys to Railway successfully, but several production environment gaps remain:

1. **Active Record Encryption** — `encrypts :settings` is commented out in models; encryption keys not provisioned
2. **No production seed script** — Can't bootstrap an initial tenant + admin user safely
3. **Backup automation** — `scripts/backup.sh` exists but isn't scheduled; no verification
4. **Environment validation** — Missing required env vars cause silent failures, not startup crashes
5. **Secret rotation** — No documentation or tooling for rotating API keys, session secrets, or encryption keys

---

## Tasks

### 1. Provision Active Record Encryption

**Background:** Rails 8 Active Record Encryption requires three keys: `primary_key`, `deterministic_key`, `key_derivation_salt`.

Generate keys:
```bash
bin/rails db:encryption:init
```

Add to Railway environment variables:
- `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY`
- `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY`
- `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT`

Create/update `apps/core/config/initializers/active_record_encryption.rb`:
```ruby
Rails.application.configure do
  config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
  config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
  config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]
end
```

Enable `encrypts :settings` in these models (currently commented out):
- `AiProviderConfig` — protects API keys stored in settings
- `IntegrationConfig` — protects OAuth tokens and API credentials

Add `encrypts :api_key` to `AiProviderConfig` — API keys should be encrypted at rest.

### 2. Create Production Seed Script

Create `apps/core/db/seeds/production.rb`:

```ruby
# Idempotent production bootstrap
# Creates initial tenant and admin user if none exist

return if Tenant.exists?

puts "Bootstrapping production environment..."

tenant = Tenant.create!(
  name: ENV.fetch("SEED_TENANT_NAME", "Default School"),
  slug: ENV.fetch("SEED_TENANT_SLUG", "default"),
  settings: {}
)

Current.tenant = tenant

school = School.create!(
  name: tenant.name,
  tenant: tenant
)

admin_email = ENV.fetch("SEED_ADMIN_EMAIL")

user = User.create!(
  email: admin_email,
  first_name: ENV.fetch("SEED_ADMIN_FIRST_NAME", "Admin"),
  last_name: ENV.fetch("SEED_ADMIN_LAST_NAME", "User"),
  tenant: tenant
)

user.add_role(:admin)

puts "Production bootstrap complete:"
puts "  Tenant: #{tenant.name} (#{tenant.slug})"
puts "  Admin: #{user.email}"

Current.tenant = nil
```

Add Rake task in `apps/core/lib/tasks/bootstrap.rake`:
```ruby
namespace :db do
  desc "Bootstrap production tenant and admin (idempotent)"
  task bootstrap: :environment do
    load Rails.root.join("db/seeds/production.rb")
  end
end
```

### 3. Strengthen Environment Validation

Update `apps/core/config/initializers/env_validation.rb`:

```ruby
# Required in all environments
REQUIRED_VARS = %w[
  DATABASE_URL
  REDIS_URL
  SECRET_KEY_BASE
].freeze

# Required only in production/staging
PRODUCTION_VARS = %w[
  ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY
  ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY
  ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT
  SENTRY_DSN
].freeze

missing = REQUIRED_VARS.select { |var| ENV[var].blank? }

if Rails.env.production? || Rails.env.staging?
  missing += PRODUCTION_VARS.select { |var| ENV[var].blank? }
end

if missing.any?
  msg = "Missing required environment variables: #{missing.join(', ')}"
  if Rails.env.production?
    abort(msg)
  else
    Rails.logger.warn(msg)
  end
end
```

### 4. Automate Backup Verification

Update `scripts/backup.sh` to include verification:

After backup:
```bash
# Verify backup integrity
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Backup verification failed for $BACKUP_FILE"
  exit 1
fi
echo "Backup verified: $BACKUP_FILE"
```

Create `apps/core/lib/tasks/backup.rake`:
```ruby
namespace :db do
  desc "Create and verify database backup"
  task backup: :environment do
    system("bash", Rails.root.join("../../scripts/backup.sh").to_s) || abort("Backup failed")
  end
end
```

### 5. Document Secret Rotation

Create `docs/SECRET_ROTATION.md`:

Document rotation procedures for:
- `SECRET_KEY_BASE` — Rails session/cookie encryption (rotates session invalidation)
- `ACTIVE_RECORD_ENCRYPTION_*` — Database field encryption (requires key rotation via Rails)
- `GOOGLE_CLIENT_SECRET` — OAuth credentials (rotate in Google Cloud Console)
- `AI_GATEWAY_SERVICE_TOKEN` — AI gateway auth (rotate in both core and gateway envs)
- `SENTRY_DSN` — Error tracking (rotate in Sentry dashboard)

For each secret:
- Where it's used
- How to rotate it
- Impact of rotation (session invalidation, data re-encryption, etc.)
- How to verify rotation succeeded

### 6. Add Production Health Check Enhancements

Update `apps/core/app/controllers/api/v1/health_controller.rb`:

Add deeper health checks:
```ruby
def show
  checks = {
    database: check_database,
    redis: check_redis,
    encryption: check_encryption,
    migrations: check_migrations,
  }

  status = checks.values.all? ? :ok : :service_unavailable
  render json: { status: status, checks: checks, version: Rails.env }
end

private

def check_database
  ActiveRecord::Base.connection.execute("SELECT 1")
  true
rescue StandardError
  false
end

def check_redis
  Redis.current.ping == "PONG"
rescue StandardError
  false
end

def check_encryption
  ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"].present?
end

def check_migrations
  !ActiveRecord::Base.connection.migration_context.needs_migration?
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/seeds/production.rb` | Idempotent production bootstrap |
| `apps/core/lib/tasks/bootstrap.rake` | `rails db:bootstrap` task |
| `apps/core/lib/tasks/backup.rake` | `rails db:backup` task |
| `docs/SECRET_ROTATION.md` | Secret rotation procedures |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/initializers/active_record_encryption.rb` | Enable encryption from env vars |
| `apps/core/config/initializers/env_validation.rb` | Strengthen required var checks |
| `apps/core/app/models/ai_provider_config.rb` | Enable `encrypts :api_key, :settings` |
| `apps/core/app/models/integration_config.rb` | Enable `encrypts :settings` |
| `apps/core/app/controllers/api/v1/health_controller.rb` | Deep health checks |
| `scripts/backup.sh` | Add backup verification |

---

## Definition of Done

- [ ] Active Record Encryption configured and enabled for sensitive fields
- [ ] Production seed script is idempotent and env-driven
- [ ] `rails db:bootstrap` task works on fresh database
- [ ] Environment validation aborts on missing required vars in production
- [ ] `scripts/backup.sh` includes verification step
- [ ] `docs/SECRET_ROTATION.md` documents all secret rotation procedures
- [ ] Health endpoint checks database, Redis, encryption, and migration status
- [ ] All existing tests pass
- [ ] No Rubocop violations
