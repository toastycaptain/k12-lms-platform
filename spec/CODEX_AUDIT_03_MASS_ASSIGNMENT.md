# CODEX_AUDIT_03 — Mass Assignment & Strong Parameters

**Priority:** CRITICAL
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/03-mass-assignment`

---

## Findings

The security audit found:

1. **`settings: {}` permits arbitrary JSONB keys** — Found in `integration_configs_controller.rb:136`, `lti_registrations_controller.rb:73`, and `resource_links_controller.rb:50`. The `settings: {}` pattern in `params.permit()` allows any nested key/value. For `IntegrationConfig`, this means an attacker with admin access could inject credential keys (e.g., `oauth_token`, `client_secret`) into the JSONB column.
2. **`preferences: {}` permits arbitrary keys** — `sessions_controller.rb:287` allows arbitrary user preferences via open JSONB permit.
3. **`metadata: {}` permits arbitrary keys** — `resource_links_controller.rb:50` allows arbitrary metadata.
4. **`to_unsafe_h` bypasses Strong Parameters** — Found in `drive_controller.rb:162`, `addon_controller.rb:249`, and `ai_invocations_controller.rb:248`. This converts ActionController::Parameters to a plain hash without filtering, defeating the purpose of Strong Parameters.

---

## Fixes

### 1. Fix IntegrationConfig Strong Parameters

**File: `apps/core/app/controllers/api/v1/integration_configs_controller.rb`**

Find the `params.permit` call that includes `settings: {}`. Replace it with explicit permitted keys:

```ruby
def integration_config_params
  params.require(:integration_config).permit(
    :provider,
    :enabled,
    settings: [
      :base_url,
      :client_id,
      :client_secret,
      :oauth_token,
      :oauth_token_secret,
      :api_key,
      :sync_enabled,
      :sync_interval_hours,
      :roster_sync,
      :grade_passback,
      :course_sync,
    ]
  )
end
```

If the current code uses `settings: {}`, replace it. If there is no explicit list and the shape varies by provider, use a sanitization approach instead:

```ruby
def integration_config_params
  base = params.require(:integration_config).permit(:provider, :enabled)
  if params[:integration_config][:settings].is_a?(ActionController::Parameters)
    sanitized = params[:integration_config][:settings].permit(allowed_settings_for_provider)
    base[:settings] = sanitized.to_h
  end
  base
end

def allowed_settings_for_provider
  case params.dig(:integration_config, :provider)
  when "one_roster"
    [:base_url, :client_id, :client_secret, :sync_enabled, :sync_interval_hours, :roster_sync, :grade_passback]
  when "google_classroom"
    [:sync_enabled, :roster_sync, :grade_passback, :course_sync]
  else
    []  # Unknown provider gets no settings
  end
end
```

### 2. Fix LTI Registration Strong Parameters

**File: `apps/core/app/controllers/api/v1/lti_registrations_controller.rb`**

Find the `params.permit` call that includes `settings: {}`. Replace with explicit keys:

```ruby
def lti_registration_params
  params.require(:lti_registration).permit(
    :issuer,
    :client_id,
    :auth_login_url,
    :auth_token_url,
    :key_set_url,
    :jwks_url,
    :platform_name,
    settings: [
      :deployment_id,
      :custom_params,
      :deep_linking_enabled,
    ]
  )
end
```

### 3. Fix ResourceLinks Strong Parameters

**File: `apps/core/app/controllers/api/v1/resource_links_controller.rb`**

Find `metadata: {}` in the permit call. Replace with explicit keys or remove if metadata is not user-editable:

```ruby
def resource_link_params
  params.require(:resource_link).permit(
    :url,
    :title,
    :linkable_type,
    :linkable_id,
    metadata: [:source, :description, :thumbnail_url]
  )
end
```

### 4. Fix User Preferences Strong Parameters

**File: `apps/core/app/controllers/api/v1/sessions_controller.rb`**

Find the preferences update endpoint that permits `preferences: {}`. Replace with explicit keys:

```ruby
def preference_params
  params.permit(
    preferences: [
      :theme,
      :locale,
      :timezone,
      :email_notifications,
      :digest_frequency,
      :dashboard_layout,
      :sidebar_collapsed,
    ]
  )
end
```

### 5. Replace `to_unsafe_h` Usages

**File: `apps/core/app/controllers/api/v1/drive_controller.rb`**

Find `to_unsafe_h` (approximately line 162). This likely converts params to a hash for JSONB storage. Replace with explicit permitted keys:

Find the line using `to_unsafe_h` and determine what fields it passes. Replace with:

```ruby
# Instead of: metadata = params[:metadata].to_unsafe_h
# Use explicit permit:
metadata = params.permit(metadata: [:file_id, :file_name, :mime_type, :icon_url, :thumbnail_url, :web_view_link]).to_h[:metadata] || {}
```

**File: `apps/core/app/controllers/api/v1/addon_controller.rb`**

Find `to_unsafe_h` (approximately line 249). Replace with:

```ruby
# Instead of: context = params[:context].to_unsafe_h
# Use explicit permit:
context = params.permit(context: [:document_id, :document_title, :document_type, :selection_text]).to_h[:context] || {}
```

**File: `apps/core/app/controllers/api/v1/ai_invocations_controller.rb`**

Find `to_unsafe_h` (approximately line 248). Replace with:

```ruby
# Instead of: applied_to = params[:applied_to].to_unsafe_h
# Use explicit permit:
applied_to = params.permit(applied_to: [:field, :model_type, :model_id, :action]).to_h[:applied_to] || {}
```

**Important:** For each `to_unsafe_h` replacement, read the surrounding code to understand what keys are actually used downstream. Permit only those keys. If the full set of keys is unknown, err on the side of fewer keys — the code will tell you what's missing when tests fail.

### 6. Validate Settings JSONB Content at Model Level

Add model-level validation for `IntegrationConfig` to prevent injection even if controller is bypassed:

**File: `apps/core/app/models/integration_config.rb`**

Add a validation:

```ruby
ALLOWED_SETTINGS_KEYS = %w[
  base_url client_id client_secret oauth_token oauth_token_secret api_key
  sync_enabled sync_interval_hours roster_sync grade_passback course_sync
  deployment_id
].freeze

validate :settings_keys_whitelisted

private

def settings_keys_whitelisted
  return if settings.blank?
  unknown_keys = settings.keys - ALLOWED_SETTINGS_KEYS
  if unknown_keys.any?
    errors.add(:settings, "contains unknown keys: #{unknown_keys.join(', ')}")
  end
end
```

### 7. Write Tests

**File: `apps/core/spec/requests/mass_assignment_audit_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Mass Assignment Audit", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  before { mock_session(admin, tenant: tenant) }
  after { Current.tenant = nil }

  describe "IntegrationConfig rejects unknown settings keys" do
    it "does not persist unknown settings keys" do
      post "/api/v1/integration_configs", params: {
        integration_config: {
          provider: "one_roster",
          settings: {
            base_url: "https://example.com",
            injected_secret: "should_not_persist",
            admin_password: "evil",
          }
        }
      }

      if response.status == 201
        config = IntegrationConfig.last
        expect(config.settings.keys).not_to include("injected_secret")
        expect(config.settings.keys).not_to include("admin_password")
      end
    end
  end

  describe "no to_unsafe_h in controllers" do
    it "codebase does not contain to_unsafe_h" do
      controller_files = Dir.glob(Rails.root.join("app/controllers/**/*.rb"))
      violations = controller_files.select do |file|
        File.read(file).include?("to_unsafe_h")
      end

      expect(violations).to be_empty,
        "Found to_unsafe_h in: #{violations.map { |f| f.sub(Rails.root.to_s, '') }.join(', ')}"
    end
  end

  describe "no open settings: {} in params.permit" do
    it "codebase does not permit arbitrary settings hash" do
      controller_files = Dir.glob(Rails.root.join("app/controllers/**/*.rb"))
      violations = controller_files.select do |file|
        content = File.read(file)
        # Match: settings: {} or metadata: {} or preferences: {}
        content.match?(/\.permit\([^)]*(?:settings|metadata|preferences):\s*\{\s*\}/)
      end

      expect(violations).to be_empty,
        "Found open hash permit in: #{violations.map { |f| f.sub(Rails.root.to_s, '') }.join(', ')}"
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/spec/requests/mass_assignment_audit_spec.rb` | Verify no open permits or to_unsafe_h |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/app/controllers/api/v1/integration_configs_controller.rb` | Replace `settings: {}` with explicit keys |
| `apps/core/app/controllers/api/v1/lti_registrations_controller.rb` | Replace `settings: {}` with explicit keys |
| `apps/core/app/controllers/api/v1/resource_links_controller.rb` | Replace `metadata: {}` with explicit keys |
| `apps/core/app/controllers/api/v1/sessions_controller.rb` | Replace `preferences: {}` with explicit keys |
| `apps/core/app/controllers/api/v1/drive_controller.rb` | Replace `to_unsafe_h` with explicit permit |
| `apps/core/app/controllers/api/v1/addon_controller.rb` | Replace `to_unsafe_h` with explicit permit |
| `apps/core/app/controllers/api/v1/ai_invocations_controller.rb` | Replace `to_unsafe_h` with explicit permit |
| `apps/core/app/models/integration_config.rb` | Add settings key whitelist validation |

## Definition of Done

- [ ] Zero instances of `settings: {}`, `metadata: {}`, or `preferences: {}` in any `params.permit()` call
- [ ] Zero instances of `to_unsafe_h` in any controller
- [ ] IntegrationConfig model validates settings keys against whitelist
- [ ] All existing tests still pass (strong param changes may break tests — update test params to match new permits)
- [ ] Codebase audit test confirms no open permits or unsafe hash conversions
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
