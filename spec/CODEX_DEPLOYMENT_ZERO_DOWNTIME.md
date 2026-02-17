# CODEX_DEPLOYMENT_ZERO_DOWNTIME — Blue-Green Deploys, Safe Migrations, and Rollback Automation

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Reliability), PRD-24 (Scope creep → phased rollout), TECH-2.11 (Security)
**Depends on:** CODEX_MONITORING_ALERTING (health checks for deploy verification)

---

## Problem

Schools operate on fixed schedules. A deploy that causes 5 minutes of downtime during a class period disrupts 30+ students and a teacher. Currently:

1. **No blue-green deployment** — deploys replace the running instance; any failure causes downtime
2. **No migration safety** — `rails db:migrate` runs during deploy; long-running migrations lock tables
3. **No canary releases** — new code goes to all users simultaneously; no gradual rollout
4. **No automated rollback** — failed deploys require manual intervention
5. **No deploy windows** — no protection against deploying during peak school hours
6. **No deploy notifications** — team has no visibility into when deploys happen or their status
7. **No feature flags** — new features can't be gradually enabled per school/role

---

## Tasks

### 1. Create Blue-Green Deploy Configuration

Create `infrastructure/deploy/blue-green.md`:

Document Railway blue-green strategy:
- Two service instances: blue (current) and green (new)
- Green instance starts, runs migrations, warms up
- Health check verifies green is ready
- Traffic switches from blue to green
- Blue kept alive for 30 minutes for rollback
- If green health check fails, traffic stays on blue

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
echo "Starting blue-green deploy to $ENVIRONMENT"

# 1. Build new image
echo "Building new image..."
docker build -t k12-core:$GIT_SHA apps/core
docker build -t k12-web:$GIT_SHA apps/web
docker build -t k12-ai:$GIT_SHA apps/ai-gateway

# 2. Deploy green instance
echo "Deploying green instance..."
railway up --service k12-core-green --image k12-core:$GIT_SHA
railway up --service k12-web-green --image k12-web:$GIT_SHA

# 3. Run migrations on green
echo "Running migrations..."
railway run --service k12-core-green -- bundle exec rails db:migrate

# 4. Health check green
echo "Checking green health..."
for i in {1..30}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" $GREEN_URL/api/v1/health)
  if [ "$STATUS" = "200" ]; then
    echo "Green is healthy!"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "Green health check failed. Aborting deploy."
    railway down --service k12-core-green
    exit 1
  fi
  sleep 2
done

# 5. Run smoke tests against green
echo "Running smoke tests..."
cd apps/load-tests && k6 run --env BASE_URL=$GREEN_URL scenarios/smoke.js
if [ $? -ne 0 ]; then
  echo "Smoke tests failed. Aborting deploy."
  railway down --service k12-core-green
  exit 1
fi

# 6. Switch traffic
echo "Switching traffic to green..."
railway domain --service k12-core-green --domain $PRODUCTION_DOMAIN
railway domain --service k12-web-green --domain $WEB_DOMAIN

# 7. Keep blue alive for rollback window
echo "Deploy complete. Blue instance kept for 30 min rollback window."
sleep 1800
railway down --service k12-core-blue
railway down --service k12-web-blue

echo "Deploy finalized."
```

### 2. Implement Expand-Contract Migration Pattern

Create `docs/MIGRATION_SAFETY.md`:

```markdown
# Safe Migration Strategy (Expand-Contract)

## Rules
1. NEVER rename or remove a column in a single deploy
2. NEVER add a NOT NULL column without a default
3. NEVER run data migrations in the same deploy as schema changes

## Pattern: Rename a Column
Deploy 1 (expand): Add new column, backfill data, update code to write both
Deploy 2 (contract): Remove old column after all code reads from new

## Pattern: Add NOT NULL Column
Deploy 1: Add column WITH default, allow NULL
Deploy 2: Backfill existing rows
Deploy 3: Add NOT NULL constraint

## Pattern: Remove a Column
Deploy 1: Stop reading from column in code
Deploy 2: Remove column from database
```

Create `apps/core/lib/safe_migration.rb`:

```ruby
module SafeMigration
  extend ActiveSupport::Concern

  class UnsafeMigrationError < StandardError; end

  included do
    # Prevent unsafe operations
    def self.inherited(subclass)
      super
      subclass.class_eval do
        def change
          raise UnsafeMigrationError, "Use up/down instead of change for production safety"
        end
      end
    end
  end

  private

  def safely_add_column(table, column, type, **options)
    # Verify it has a default if NOT NULL
    if options[:null] == false && !options.key?(:default)
      raise UnsafeMigrationError, "Cannot add NOT NULL column without default"
    end
    add_column(table, column, type, **options)
  end

  def safely_remove_column(table, column)
    # Verify no code references this column
    # In practice: just use remove_column but log it
    remove_column(table, column)
  end
end
```

### 3. Create Deploy Window Protection

Create `apps/core/app/services/deploy_window_service.rb`:

```ruby
class DeployWindowService
  # School hours by timezone (configurable per tenant, default US Eastern)
  BLOCKED_WINDOWS = {
    weekday: (8..15),  # 8 AM - 3 PM local time
  }.freeze

  def self.safe_to_deploy?(timezone: "America/New_York")
    time = Time.current.in_time_zone(timezone)
    return true if time.saturday? || time.sunday?

    hour = time.hour
    !BLOCKED_WINDOWS[:weekday].include?(hour)
  end

  def self.next_safe_window(timezone: "America/New_York")
    time = Time.current.in_time_zone(timezone)
    # Find next safe window (after 3 PM weekday, or weekend)
    if time.hour < 15 && !time.saturday? && !time.sunday?
      time.change(hour: 15, min: 30)
    else
      time + 1.hour # Already in safe window
    end
  end
end
```

### 4. Create Rollback Automation

Create `scripts/rollback.sh`:

```bash
#!/bin/bash
set -euo pipefail

echo "Rolling back to blue instance..."

# 1. Switch traffic back to blue
railway domain --service k12-core-blue --domain $PRODUCTION_DOMAIN
railway domain --service k12-web-blue --domain $WEB_DOMAIN

# 2. Verify blue is healthy
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BLUE_URL/api/v1/health)
if [ "$STATUS" != "200" ]; then
  echo "WARNING: Blue instance not healthy. Manual intervention required."
  exit 1
fi

# 3. Tear down green
railway down --service k12-core-green
railway down --service k12-web-green

echo "Rollback complete. Traffic restored to blue."
```

### 5. Create Feature Flag System

Create `apps/core/app/models/feature_flag.rb`:

```ruby
class FeatureFlag
  DEFAULTS = {
    "portfolio_enabled" => true,
    "webhook_events" => true,
    "ai_safety_v2" => false,
    "i18n_locale_switcher" => false,
    "advanced_analytics" => true,
  }.freeze

  def self.enabled?(flag, tenant: Current.tenant)
    # Check tenant-specific override first
    tenant_setting = tenant&.settings&.dig("features", flag)
    return tenant_setting unless tenant_setting.nil?

    # Fall back to global default
    DEFAULTS.fetch(flag, false)
  end

  def self.enable!(flag, tenant: Current.tenant)
    tenant.settings["features"] ||= {}
    tenant.settings["features"][flag] = true
    tenant.save!
  end

  def self.disable!(flag, tenant: Current.tenant)
    tenant.settings["features"] ||= {}
    tenant.settings["features"][flag] = false
    tenant.save!
  end
end
```

### 6. Create Deploy Notification System

Update deploy script to notify team:

```bash
# Notify Slack on deploy start
curl -X POST $SLACK_DEPLOY_WEBHOOK -d "{
  \"text\": \"🚀 Deploy started: $GIT_SHA by $DEPLOY_USER to $ENVIRONMENT\"
}"

# ... deploy steps ...

# Notify on success
curl -X POST $SLACK_DEPLOY_WEBHOOK -d "{
  \"text\": \"✅ Deploy complete: $GIT_SHA to $ENVIRONMENT ($(date))\"
}"

# Notify on failure
curl -X POST $SLACK_DEPLOY_WEBHOOK -d "{
  \"text\": \"❌ Deploy FAILED: $GIT_SHA to $ENVIRONMENT - rolling back\"
}"
```

### 7. Update CI/CD Pipeline

Update `.github/workflows/deploy.yml`:

```yaml
deploy:
  runs-on: ubuntu-latest
  steps:
    - name: Check deploy window
      run: |
        SAFE=$(curl -s $CORE_URL/api/v1/admin/deploy/safe_window)
        if [ "$SAFE" != "true" ]; then
          echo "Deploy blocked: school hours active"
          exit 1
        fi

    - name: Run blue-green deploy
      run: bash scripts/deploy.sh production

    - name: Post-deploy smoke test
      run: cd apps/load-tests && k6 run scenarios/smoke.js

    - name: Rollback on failure
      if: failure()
      run: bash scripts/rollback.sh
```

### 8. Build Deploy Dashboard

Create `apps/web/src/app/admin/operations/deploys/page.tsx`:

**Layout:**
- **Current Version** — Git SHA, deploy time, deployed by
- **Deploy History** — Table: version, timestamp, status (success/failed/rolled back), duration
- **Deploy Window** — Current status (safe/blocked), next safe window
- **Feature Flags** — Toggle list for this tenant

### 9. Add Tests

- `apps/core/spec/services/deploy_window_service_spec.rb` — Safe/blocked windows
- `apps/core/spec/models/feature_flag_spec.rb` — Enable/disable, tenant override, defaults
- `scripts/deploy.sh` — Shellcheck lint

---

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/deploy.sh` | Blue-green deploy script |
| `scripts/rollback.sh` | Automated rollback script |
| `infrastructure/deploy/blue-green.md` | Deploy architecture documentation |
| `docs/MIGRATION_SAFETY.md` | Expand-contract migration guide |
| `apps/core/lib/safe_migration.rb` | Migration safety checks |
| `apps/core/app/services/deploy_window_service.rb` | School hours protection |
| `apps/core/app/models/feature_flag.rb` | Feature flag system |
| `apps/web/src/app/admin/operations/deploys/page.tsx` | Deploy dashboard |

## Files to Modify

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | Blue-green deploy with rollback |
| `apps/core/config/routes.rb` | Add deploy window and feature flag routes |
| `apps/core/app/models/tenant.rb` | Feature flag settings |

---

## Definition of Done

- [ ] Blue-green deploy script builds, deploys, health-checks, and switches traffic
- [ ] Rollback script restores traffic to previous version within 1 minute
- [ ] Deploy window protection blocks deploys during school hours (8 AM - 3 PM)
- [ ] Expand-contract migration pattern documented with examples
- [ ] SafeMigration module prevents common unsafe migration patterns
- [ ] Feature flag system supports per-tenant overrides with global defaults
- [ ] Deploy notifications sent to Slack on start, success, and failure
- [ ] Post-deploy smoke tests run automatically
- [ ] CI pipeline includes rollback-on-failure step
- [ ] Deploy dashboard shows version history and feature flag toggles
- [ ] All tests pass
