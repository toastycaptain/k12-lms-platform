# CODEX_TASK_07 — Deploy Infrastructure (Backend Only — Scripts + Ruby Services)

**Priority:** P2
**Effort:** 6–8 hours
**Depends On:** Task 04 (Monitoring & Alerting)
**Branch:** `batch7/07-deploy-infrastructure`

---

## Objective

Build zero-downtime deployment infrastructure: safe migration module, deploy window protection service, feature flag system, deploy scripts with health checks and rollback, and deploy notification hooks. Skip frontend pages — expose data via API.

---

## Tasks

### 1. Create SafeMigration Module

**File: `apps/core/lib/safe_migration.rb`**

```ruby
module SafeMigration
  extend ActiveSupport::Concern

  class UnsafeMigrationError < StandardError; end

  # Guard methods to enforce safe migration practices

  def safely_add_column(table, column, type, **options)
    if options[:null] == false && !options.key?(:default)
      raise UnsafeMigrationError,
        "Cannot add NOT NULL column '#{column}' to '#{table}' without a default value. " \
        "This locks the table while backfilling. Add with a default, or allow NULL first."
    end
    add_column(table, column, type, **options)
  end

  def safely_remove_column(table, column)
    # Verify the column exists before trying to remove it
    unless column_exists?(table, column)
      Rails.logger.warn("[SafeMigration] Column #{table}.#{column} does not exist, skipping removal")
      return
    end
    remove_column(table, column)
  end

  def safely_rename_column(_table, _old_name, _new_name)
    raise UnsafeMigrationError,
      "Never rename a column directly. Use the expand-contract pattern:\n" \
      "  Deploy 1: Add new column, backfill, write to both\n" \
      "  Deploy 2: Read from new column, stop writing old\n" \
      "  Deploy 3: Remove old column"
  end

  def safely_change_column_null(table, column, null, default = nil)
    if null == false && default.nil?
      # Check if there are any NULL values
      count = execute("SELECT COUNT(*) FROM #{table} WHERE #{column} IS NULL").first["count"].to_i
      if count > 0
        raise UnsafeMigrationError,
          "Cannot set NOT NULL on '#{table}.#{column}' — #{count} rows have NULL values. " \
          "Backfill first, then add the constraint."
      end
    end
    change_column_null(table, column, null, default)
  end
end
```

### 2. Create DeployWindowService

**File: `apps/core/app/services/deploy_window_service.rb`**

```ruby
class DeployWindowService
  # Default blocked window: weekdays 8 AM - 3 PM (school hours)
  DEFAULT_BLOCKED_HOURS = (8..14).freeze  # 8:00-14:59 (last class typically ends by 3:00)
  DEFAULT_TIMEZONE = "America/New_York"

  def self.safe_to_deploy?(timezone: DEFAULT_TIMEZONE)
    time = Time.current.in_time_zone(timezone)

    # Weekends are always safe
    return true if time.saturday? || time.sunday?

    # Outside school hours is safe
    !DEFAULT_BLOCKED_HOURS.include?(time.hour)
  end

  def self.next_safe_window(timezone: DEFAULT_TIMEZONE)
    time = Time.current.in_time_zone(timezone)

    if safe_to_deploy?(timezone: timezone)
      # Already in a safe window
      { safe_now: true, current_time: time.iso8601 }
    else
      # Find next safe window
      next_safe = time.change(hour: 15, min: 30)  # 3:30 PM after school
      {
        safe_now: false,
        current_time: time.iso8601,
        next_window: next_safe.iso8601,
        wait_minutes: ((next_safe - time) / 60).ceil,
      }
    end
  end

  def self.status(timezone: DEFAULT_TIMEZONE)
    {
      safe_to_deploy: safe_to_deploy?(timezone: timezone),
      timezone: timezone,
      blocked_hours: "#{DEFAULT_BLOCKED_HOURS.first}:00 - #{DEFAULT_BLOCKED_HOURS.last + 1}:00",
      blocked_days: "Monday - Friday",
      **next_safe_window(timezone: timezone),
    }
  end
end
```

### 3. Create FeatureFlag Model

Create a migration:

```ruby
class CreateFeatureFlags < ActiveRecord::Migration[8.0]
  def change
    create_table :feature_flags do |t|
      t.references :tenant, null: true, foreign_key: true  # nil = global default
      t.string :key, null: false
      t.boolean :enabled, null: false, default: false
      t.string :description
      t.jsonb :metadata, default: {}  # For percentage rollouts, user targeting, etc.

      t.timestamps
    end

    add_index :feature_flags, [:tenant_id, :key], unique: true
    add_index :feature_flags, :key
  end
end
```

**File: `apps/core/app/models/feature_flag.rb`**

```ruby
class FeatureFlag < ApplicationRecord
  belongs_to :tenant, optional: true  # nil = global default

  GLOBAL_DEFAULTS = {
    "portfolio_enabled" => true,
    "webhook_events" => true,
    "ai_safety_v2" => true,
    "i18n_locale_switcher" => false,
    "advanced_analytics" => true,
    "guardian_portal" => true,
    "resource_library" => true,
    "print_export" => true,
    "bulk_operations" => true,
  }.freeze

  validates :key, presence: true
  validates :key, uniqueness: { scope: :tenant_id }

  scope :global_defaults, -> { where(tenant_id: nil) }
  scope :for_tenant, ->(tenant) { where(tenant_id: [nil, tenant.id]) }

  def self.enabled?(key, tenant: Current.tenant)
    # Check tenant-specific override first
    if tenant
      tenant_flag = find_by(key: key, tenant_id: tenant.id)
      return tenant_flag.enabled if tenant_flag
    end

    # Check global flag
    global_flag = find_by(key: key, tenant_id: nil)
    return global_flag.enabled if global_flag

    # Fall back to hardcoded defaults
    GLOBAL_DEFAULTS.fetch(key.to_s, false)
  end

  def self.enable!(key, tenant: Current.tenant)
    flag = find_or_initialize_by(key: key, tenant_id: tenant&.id)
    flag.enabled = true
    flag.save!
    flag
  end

  def self.disable!(key, tenant: Current.tenant)
    flag = find_or_initialize_by(key: key, tenant_id: tenant&.id)
    flag.enabled = false
    flag.save!
    flag
  end

  def self.all_flags(tenant: Current.tenant)
    result = {}

    # Start with hardcoded defaults
    GLOBAL_DEFAULTS.each { |key, value| result[key] = value }

    # Override with global DB flags
    global_defaults.each { |flag| result[flag.key] = flag.enabled }

    # Override with tenant-specific flags
    if tenant
      where(tenant_id: tenant.id).each { |flag| result[flag.key] = flag.enabled }
    end

    result
  end
end
```

### 4. Create Deploy API Controller

**File: `apps/core/app/controllers/api/v1/admin/deploy_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class DeployController < ApplicationController
        before_action :authorize_admin

        # GET /api/v1/admin/deploy/safe_window
        def safe_window
          authorize :deploy, :view?
          timezone = Current.tenant&.schools&.first&.timezone || "America/New_York"
          render json: DeployWindowService.status(timezone: timezone)
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

### 5. Create Feature Flag API Controller

**File: `apps/core/app/controllers/api/v1/admin/feature_flags_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class FeatureFlagsController < ApplicationController
        before_action :authorize_admin

        # GET /api/v1/admin/feature_flags
        def index
          authorize FeatureFlag
          flags = FeatureFlag.all_flags(tenant: Current.tenant)
          render json: flags.map { |key, enabled| { key: key, enabled: enabled } }
        end

        # PUT /api/v1/admin/feature_flags/:key
        def update
          flag = FeatureFlag.find_or_initialize_by(
            key: params[:key],
            tenant_id: Current.tenant&.id
          )
          authorize flag

          flag.enabled = params[:enabled]
          flag.description = params[:description] if params[:description].present?

          if flag.save
            render json: { key: flag.key, enabled: flag.enabled, tenant_id: flag.tenant_id }
          else
            render json: { errors: flag.errors.full_messages }, status: :unprocessable_content
          end
        end

        # DELETE /api/v1/admin/feature_flags/:key
        def destroy
          flag = FeatureFlag.find_by(key: params[:key], tenant_id: Current.tenant&.id)
          if flag
            authorize flag
            flag.destroy!
            render json: { message: "Flag removed, global default will apply" }
          else
            head :not_found
          end
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

### 6. Create Policies and Serializer

**File: `apps/core/app/policies/deploy_policy.rb`**

```ruby
class DeployPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end
end
```

**File: `apps/core/app/policies/feature_flag_policy.rb`**

```ruby
class FeatureFlagPolicy < ApplicationPolicy
  def index?
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
      scope.all
    end
  end
end
```

### 7. Add Routes

Update `apps/core/config/routes.rb` — add within the `namespace :admin` block:

```ruby
namespace :admin do
  # ... existing routes ...
  namespace :deploy do
    get :safe_window
  end
  resources :feature_flags, only: [:index, :update, :destroy], param: :key
end
```

### 8. Create Deploy Scripts

**File: `scripts/deploy.sh`**

```bash
#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
GIT_SHA=$(git rev-parse --short HEAD)
DEPLOY_USER=${DEPLOY_USER:-$(git config user.email)}
SLACK_DEPLOY_WEBHOOK=${SLACK_DEPLOY_WEBHOOK:-""}

echo "================================================"
echo "Blue-Green Deploy to $ENVIRONMENT"
echo "Git SHA: $GIT_SHA"
echo "User: $DEPLOY_USER"
echo "Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "================================================"

# Notify start
if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \":rocket: Deploy started: $GIT_SHA by $DEPLOY_USER to $ENVIRONMENT\"}" || true
fi

# 1. Check deploy window (skip for staging)
if [ "$ENVIRONMENT" = "production" ]; then
  echo "Checking deploy window..."
  SAFE=$(curl -sf "${CORE_URL:-http://localhost:3000}/api/v1/admin/deploy/safe_window" | grep -o '"safe_to_deploy":true' || echo "")
  if [ -z "$SAFE" ]; then
    echo "ERROR: Deploy blocked — school hours active. Use staging or wait for safe window."
    if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
      curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \":no_entry: Deploy BLOCKED: school hours active ($ENVIRONMENT)\"}" || true
    fi
    exit 1
  fi
  echo "Deploy window is safe."
fi

# 2. Run pre-deploy checks
echo "Running pre-deploy checks..."
cd apps/core && bundle exec rubocop --fail-level=error -f simple && cd ../..
cd apps/web && npm run typecheck && cd ../..

# 3. Run tests
echo "Running tests..."
cd apps/core && bundle exec rspec --fail-fast && cd ../..

# 4. Build
echo "Building..."
cd apps/web && npm run build && cd ../..

# 5. Run migrations
echo "Running migrations..."
cd apps/core && bundle exec rails db:migrate && cd ../..

# 6. Health check
echo "Checking health..."
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CORE_URL:-http://localhost:3000}/api/v1/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Health check passed."
    break
  fi
  if [ "$i" = "30" ]; then
    echo "ERROR: Health check failed after 30 attempts."
    if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
      curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \":x: Deploy FAILED: health check failed ($ENVIRONMENT) — $GIT_SHA\"}" || true
    fi
    exit 1
  fi
  echo "  Attempt $i/30 — status: $STATUS, retrying in 2s..."
  sleep 2
done

# 7. Notify success
echo "================================================"
echo "Deploy complete: $GIT_SHA to $ENVIRONMENT"
echo "================================================"

if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \":white_check_mark: Deploy complete: $GIT_SHA to $ENVIRONMENT ($(date -u +"%H:%M UTC"))\"}" || true
fi
```

**File: `scripts/rollback.sh`**

```bash
#!/bin/bash
set -euo pipefail

SLACK_DEPLOY_WEBHOOK=${SLACK_DEPLOY_WEBHOOK:-""}

echo "================================================"
echo "Rolling back..."
echo "Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "================================================"

# Notify rollback start
if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \":warning: Rollback initiated at $(date -u +"%H:%M UTC")\"}" || true
fi

# 1. Rollback migrations (one step)
echo "Rolling back last migration..."
cd apps/core && bundle exec rails db:rollback STEP=1 && cd ../..

# 2. Health check
echo "Checking health after rollback..."
for i in $(seq 1 15); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CORE_URL:-http://localhost:3000}/api/v1/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "Health check passed after rollback."
    break
  fi
  if [ "$i" = "15" ]; then
    echo "WARNING: Health check still failing after rollback. Manual intervention required."
    if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
      curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \":rotating_light: CRITICAL: Rollback completed but health check still failing. Manual intervention required.\"}" || true
    fi
    exit 1
  fi
  sleep 2
done

echo "================================================"
echo "Rollback complete."
echo "================================================"

if [ -n "$SLACK_DEPLOY_WEBHOOK" ]; then
  curl -s -X POST "$SLACK_DEPLOY_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \":rewind: Rollback complete. System healthy.\"}" || true
fi
```

Make scripts executable:
```bash
chmod +x scripts/deploy.sh scripts/rollback.sh
```

### 9. Update CI Pipeline

Update `.github/workflows/deploy.yml` (create if it doesn't exist):

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Check deploy window (production only)
        if: github.event.inputs.environment == 'production'
        run: |
          SAFE=$(curl -sf "${{ secrets.CORE_URL }}/api/v1/admin/deploy/safe_window" | grep -o '"safe_to_deploy":true' || echo "")
          if [ -z "$SAFE" ]; then
            echo "::error::Deploy blocked: school hours active"
            exit 1
          fi

      - name: Run deploy
        run: bash scripts/deploy.sh ${{ github.event.inputs.environment }}
        env:
          CORE_URL: ${{ secrets.CORE_URL }}
          SLACK_DEPLOY_WEBHOOK: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
          DEPLOY_USER: ${{ github.actor }}

      - name: Rollback on failure
        if: failure()
        run: bash scripts/rollback.sh
        env:
          CORE_URL: ${{ secrets.CORE_URL }}
          SLACK_DEPLOY_WEBHOOK: ${{ secrets.SLACK_DEPLOY_WEBHOOK }}
```

### 10. Write Tests

**File: `apps/core/spec/services/deploy_window_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe DeployWindowService do
  describe ".safe_to_deploy?" do
    it "returns true on weekends" do
      travel_to Time.zone.parse("2026-02-21 10:00:00") do  # Saturday
        expect(described_class.safe_to_deploy?).to be true
      end
    end

    it "returns false during school hours on weekdays" do
      travel_to Time.zone.parse("2026-02-16 10:00:00") do  # Monday 10 AM
        expect(described_class.safe_to_deploy?(timezone: "America/New_York")).to be false
      end
    end

    it "returns true before school hours" do
      travel_to Time.zone.parse("2026-02-16 06:00:00") do  # Monday 6 AM
        expect(described_class.safe_to_deploy?(timezone: "America/New_York")).to be true
      end
    end

    it "returns true after school hours" do
      travel_to Time.zone.parse("2026-02-16 16:00:00") do  # Monday 4 PM
        expect(described_class.safe_to_deploy?(timezone: "America/New_York")).to be true
      end
    end
  end

  describe ".next_safe_window" do
    it "returns safe_now true when in safe window" do
      travel_to Time.zone.parse("2026-02-21 10:00:00") do  # Saturday
        result = described_class.next_safe_window
        expect(result[:safe_now]).to be true
      end
    end

    it "returns next window when in blocked window" do
      travel_to Time.zone.parse("2026-02-16 10:00:00") do  # Monday 10 AM
        result = described_class.next_safe_window(timezone: "America/New_York")
        expect(result[:safe_now]).to be false
        expect(result[:next_window]).to be_present
        expect(result[:wait_minutes]).to be > 0
      end
    end
  end

  describe ".status" do
    it "returns complete status hash" do
      result = described_class.status
      expect(result).to have_key(:safe_to_deploy)
      expect(result).to have_key(:timezone)
      expect(result).to have_key(:blocked_hours)
    end
  end
end
```

**File: `apps/core/spec/models/feature_flag_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe FeatureFlag, type: :model do
  let!(:tenant) { create(:tenant) }

  after { Current.tenant = nil }

  describe ".enabled?" do
    it "returns hardcoded default when no DB flag exists" do
      expect(described_class.enabled?("portfolio_enabled", tenant: tenant)).to be true
      expect(described_class.enabled?("i18n_locale_switcher", tenant: tenant)).to be false
    end

    it "returns false for unknown flags" do
      expect(described_class.enabled?("nonexistent_flag", tenant: tenant)).to be false
    end

    it "uses global DB flag over hardcoded default" do
      described_class.create!(key: "portfolio_enabled", tenant: nil, enabled: false)
      expect(described_class.enabled?("portfolio_enabled", tenant: tenant)).to be false
    end

    it "uses tenant-specific flag over global" do
      described_class.create!(key: "portfolio_enabled", tenant: nil, enabled: true)
      described_class.create!(key: "portfolio_enabled", tenant: tenant, enabled: false)
      expect(described_class.enabled?("portfolio_enabled", tenant: tenant)).to be false
    end
  end

  describe ".enable!" do
    it "creates or updates a flag to enabled" do
      flag = described_class.enable!("new_feature", tenant: tenant)
      expect(flag.enabled).to be true
      expect(flag.tenant_id).to eq(tenant.id)
    end
  end

  describe ".disable!" do
    it "creates or updates a flag to disabled" do
      described_class.enable!("new_feature", tenant: tenant)
      flag = described_class.disable!("new_feature", tenant: tenant)
      expect(flag.enabled).to be false
    end
  end

  describe ".all_flags" do
    it "returns merged flags with tenant overrides" do
      described_class.create!(key: "custom_flag", tenant: nil, enabled: true)
      described_class.create!(key: "portfolio_enabled", tenant: tenant, enabled: false)

      flags = described_class.all_flags(tenant: tenant)
      expect(flags["portfolio_enabled"]).to be false  # Tenant override
      expect(flags["custom_flag"]).to be true          # Global flag
      expect(flags["webhook_events"]).to be true       # Hardcoded default
    end
  end

  describe "validations" do
    it "requires key" do
      flag = described_class.new(key: nil, enabled: true)
      expect(flag).not_to be_valid
    end

    it "enforces unique key per tenant" do
      described_class.create!(key: "test", tenant: tenant, enabled: true)
      duplicate = described_class.new(key: "test", tenant: tenant, enabled: false)
      expect(duplicate).not_to be_valid
    end

    it "allows same key for different tenants" do
      other_tenant = create(:tenant)
      described_class.create!(key: "test", tenant: tenant, enabled: true)
      flag = described_class.new(key: "test", tenant: other_tenant, enabled: false)
      expect(flag).to be_valid
    end
  end
end
```

**File: `apps/core/spec/lib/safe_migration_spec.rb`**

```ruby
require "rails_helper"
require "safe_migration"

RSpec.describe SafeMigration do
  let(:migration) do
    Class.new(ActiveRecord::Migration[8.0]) do
      include SafeMigration
    end.new("test", 1)
  end

  describe "#safely_add_column" do
    it "raises on NOT NULL without default" do
      expect {
        migration.safely_add_column(:users, :test_col, :string, null: false)
      }.to raise_error(SafeMigration::UnsafeMigrationError, /default/)
    end

    it "allows NOT NULL with default" do
      # We can't actually run this without a table, but we can verify it doesn't raise
      allow(migration).to receive(:add_column)
      expect {
        migration.safely_add_column(:users, :test_col, :string, null: false, default: "")
      }.not_to raise_error
    end

    it "allows nullable column without default" do
      allow(migration).to receive(:add_column)
      expect {
        migration.safely_add_column(:users, :test_col, :string)
      }.not_to raise_error
    end
  end

  describe "#safely_rename_column" do
    it "always raises with expand-contract guidance" do
      expect {
        migration.safely_rename_column(:users, :old_name, :new_name)
      }.to raise_error(SafeMigration::UnsafeMigrationError, /expand-contract/)
    end
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/deploy_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::Deploy", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/deploy/safe_window" do
    it "returns deploy window status" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/deploy/safe_window"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body).to have_key("safe_to_deploy")
      expect(body).to have_key("timezone")
    end
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/feature_flags_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::FeatureFlags", type: :request do
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

  describe "GET /api/v1/admin/feature_flags" do
    it "returns all flags for admin" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/feature_flags"

      expect(response).to have_http_status(:ok)
      flags = response.parsed_body
      expect(flags).to be_an(Array)
      # Should include at least the hardcoded defaults
      keys = flags.map { |f| f["key"] }
      expect(keys).to include("portfolio_enabled")
    end

    it "returns 403 for non-admin" do
      mock_session(teacher, tenant: tenant)
      get "/api/v1/admin/feature_flags"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PUT /api/v1/admin/feature_flags/:key" do
    it "toggles a feature flag" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/feature_flags/portfolio_enabled", params: { enabled: false }
      expect(response).to have_http_status(:ok)
      expect(FeatureFlag.enabled?("portfolio_enabled", tenant: tenant)).to be false
    end
  end

  describe "DELETE /api/v1/admin/feature_flags/:key" do
    it "removes tenant override" do
      mock_session(admin, tenant: tenant)
      FeatureFlag.create!(key: "test_flag", tenant: tenant, enabled: true)

      delete "/api/v1/admin/feature_flags/test_flag"
      expect(response).to have_http_status(:ok)
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/lib/safe_migration.rb` | Migration safety guards |
| `apps/core/app/services/deploy_window_service.rb` | School hours protection |
| `db/migrate/YYYYMMDDHHMMSS_create_feature_flags.rb` | Feature flag table |
| `apps/core/app/models/feature_flag.rb` | Feature flag model with layered lookup |
| `apps/core/app/controllers/api/v1/admin/deploy_controller.rb` | Deploy window API |
| `apps/core/app/controllers/api/v1/admin/feature_flags_controller.rb` | Feature flag CRUD API |
| `apps/core/app/policies/deploy_policy.rb` | Admin-only deploy access |
| `apps/core/app/policies/feature_flag_policy.rb` | Admin-only flag access |
| `scripts/deploy.sh` | Blue-green deploy script |
| `scripts/rollback.sh` | Rollback script |
| `.github/workflows/deploy.yml` | Deploy CI pipeline |
| All spec files listed above | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/routes.rb` | Add deploy and feature_flags routes under admin namespace |

---

## Definition of Done

- [ ] SafeMigration prevents NOT NULL without default, direct column rename
- [ ] DeployWindowService blocks deploys during school hours (8 AM - 3 PM weekdays)
- [ ] DeployWindowService reports next safe window with wait time
- [ ] FeatureFlag model supports 3-layer lookup: tenant override > global DB > hardcoded default
- [ ] FeatureFlag.enabled? works correctly with all 3 layers
- [ ] Feature flag CRUD API allows admins to toggle per-tenant flags
- [ ] Deploy window API returns current status for admins
- [ ] deploy.sh checks window, runs tests, builds, migrates, health checks, notifies Slack
- [ ] rollback.sh rolls back migration, health checks, notifies Slack
- [ ] deploy.yml supports manual workflow dispatch with environment selection
- [ ] Scripts pass shellcheck (install and run: `shellcheck scripts/*.sh`)
- [ ] All RSpec tests pass
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
