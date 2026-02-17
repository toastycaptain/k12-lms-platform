# CODEX_AUDIT_04 — Serializer Data Exposure

**Priority:** HIGH
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/04-serializer-exposure`

---

## Findings

The security audit found:

1. **IntegrationConfigSerializer exposes `settings`** — The `settings` JSONB column stores encrypted credentials (client_secret, oauth_token, api_key). Even though Rails `encrypts` the column at rest, the serializer decrypts and returns the full value in API responses. This leaks secrets to any admin who can hit the index/show endpoints.
2. **AiProviderConfigSerializer exposes `settings`** — Same issue. AI provider API keys are serialized in responses.
3. **LtiRegistrationSerializer exposes `settings`** — May contain client secrets for LTI 1.3 authentication.
4. **AiInvocationSerializer exposes `context`** — The `context` JSONB may contain AI prompts with sensitive student data or internal system prompt content.

---

## Fixes

### 1. Fix IntegrationConfigSerializer

**File: `apps/core/app/serializers/integration_config_serializer.rb`**

Read the current file. It likely includes `settings` in the `attributes` list. Replace the `settings` attribute with a redacted version:

Remove `settings` from the attributes list. Add a custom method:

```ruby
class IntegrationConfigSerializer < ActiveModel::Serializer
  attributes :id, :provider, :tenant_id, :enabled, :settings_summary, :created_at, :updated_at

  # Never expose raw settings — they contain encrypted credentials
  def settings_summary
    return {} if object.settings.blank?

    object.settings.transform_values do |value|
      if value.is_a?(String) && value.length > 4
        "#{value[0..3]}#{'*' * [value.length - 4, 8].min}"
      elsif value.is_a?(String)
        "****"
      else
        value  # Booleans, integers are safe to expose
      end
    end
  end
end
```

This returns `{ "base_url" => "http****", "client_secret" => "sk-t****" }` instead of full values.

### 2. Fix AiProviderConfigSerializer

**File: `apps/core/app/serializers/ai_provider_config_serializer.rb`**

Read the current file. Remove `api_key` and `settings` from attributes. Add redacted versions:

```ruby
class AiProviderConfigSerializer < ActiveModel::Serializer
  attributes :id, :provider_name, :model_name, :tenant_id, :enabled,
    :has_api_key, :settings_summary, :created_at, :updated_at

  # Never expose the raw API key
  def has_api_key
    object.api_key.present?
  end

  def settings_summary
    return {} if object.settings.blank?

    object.settings.transform_values do |value|
      if value.is_a?(String) && value.length > 4
        "#{value[0..3]}#{'*' * [value.length - 4, 8].min}"
      elsif value.is_a?(String)
        "****"
      else
        value
      end
    end
  end
end
```

**Important:** Read the existing serializer first. Keep all non-sensitive attributes exactly as they are. Only replace sensitive fields (`api_key`, `settings` containing credentials) with redacted versions.

### 3. Fix LtiRegistrationSerializer

**File: `apps/core/app/serializers/lti_registration_serializer.rb`**

Read the current file. If `settings` is in the attributes list, replace it with a redacted version:

```ruby
class LtiRegistrationSerializer < ActiveModel::Serializer
  # Keep all existing non-sensitive attributes
  # Replace :settings with :settings_summary

  def settings_summary
    return {} if object.settings.blank?

    safe_keys = %w[deployment_id deep_linking_enabled custom_params]
    secret_keys = object.settings.keys - safe_keys

    result = object.settings.slice(*safe_keys)
    secret_keys.each { |k| result[k] = "****" }
    result
  end
end
```

### 4. Fix AiInvocationSerializer

**File: `apps/core/app/serializers/ai_invocation_serializer.rb`**

Read the current file. The `context` field may contain the full AI prompt including student data. Redact the prompt content:

```ruby
class AiInvocationSerializer < ActiveModel::Serializer
  # Keep all existing attributes EXCEPT replace context with safe_context

  def safe_context
    return {} if object.context.blank?

    # Expose metadata but redact prompt content
    safe = object.context.except("prompt", "messages", "system_prompt")
    safe["has_prompt"] = object.context.key?("prompt") || object.context.key?("messages")
    safe
  end
end
```

Replace `context` with `safe_context` in the attributes list.

### 5. Audit All Other Serializers for Sensitive Fields

Read every serializer in `apps/core/app/serializers/`. For each one, check:

- Does it expose `settings` (JSONB that could contain credentials)? → Redact
- Does it expose `token`, `secret`, `key`, `password`? → Remove or redact
- Does it expose `google_access_token` or `google_refresh_token`? → Remove
- Does it expose fields that belong to other tenants? → Verify TenantScoped prevents this

The `UserSerializer` currently exposes: `id, email, first_name, last_name, tenant_id, roles, created_at, updated_at`. This is safe — no tokens or passwords.

**Key check:** Verify that `UserSerializer` does NOT expose `google_access_token` or `google_refresh_token`. If it does, remove those fields immediately.

### 6. Create a Serializer Safety Test

**File: `apps/core/spec/serializers/sensitive_data_audit_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Serializer Sensitive Data Audit" do
  FORBIDDEN_ATTRIBUTE_PATTERNS = %w[
    password
    secret
    token
    api_key
    access_token
    refresh_token
    private_key
  ].freeze

  SERIALIZER_DIR = Rails.root.join("app/serializers")

  Dir.glob(SERIALIZER_DIR.join("*.rb")).each do |file|
    serializer_name = File.basename(file, ".rb").camelize

    describe serializer_name do
      it "does not directly expose sensitive attributes" do
        content = File.read(file)

        # Extract attributes from the serializer
        # Match: attributes :foo, :bar, :baz
        attribute_line = content.scan(/attributes\s+(.+)$/i).flatten.join(", ")
        attributes = attribute_line.scan(/:\w+/).map { |a| a.delete(":") }

        sensitive = attributes.select do |attr|
          FORBIDDEN_ATTRIBUTE_PATTERNS.any? { |pattern| attr.include?(pattern) }
        end

        expect(sensitive).to be_empty,
          "#{serializer_name} exposes sensitive attributes: #{sensitive.join(', ')}. " \
          "Use redacted helper methods instead."
      end

      it "does not expose raw 'settings' JSONB without redaction" do
        content = File.read(file)

        # Check if serializer exposes :settings as a direct attribute
        # This is only a problem if the model's settings contain credentials
        if content.match?(/attributes\s+.*:settings[,\s\n]/) && !content.include?("def settings")
          # Has :settings attribute but no custom method — raw exposure
          model_name = serializer_name.sub("Serializer", "")
          sensitive_models = %w[IntegrationConfig AiProviderConfig LtiRegistration]

          if sensitive_models.include?(model_name)
            fail "#{serializer_name} exposes raw :settings for #{model_name}, which may contain credentials. Use a redacted method."
          end
        end
      end
    end
  end
end
```

### 7. Write Request Tests

**File: `apps/core/spec/requests/serializer_exposure_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Serializer Data Exposure", type: :request do
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

  describe "GET /api/v1/integration_configs" do
    it "does not expose raw credentials in settings" do
      Current.tenant = tenant
      IntegrationConfig.create!(
        tenant: tenant,
        provider: "one_roster",
        settings: { "client_secret" => "super_secret_value_123", "base_url" => "https://example.com" }
      )
      Current.tenant = nil

      get "/api/v1/integration_configs"
      expect(response).to have_http_status(:ok)

      body = response.parsed_body
      next if body.empty?  # Skip if policy blocks access

      config = body.first
      # The raw secret should NOT appear in the response
      response_text = response.body
      expect(response_text).not_to include("super_secret_value_123")
    end
  end

  describe "GET /api/v1/users" do
    it "does not expose google tokens" do
      get "/api/v1/users"
      expect(response).to have_http_status(:ok)

      response.parsed_body.each do |user_json|
        expect(user_json.keys).not_to include("google_access_token")
        expect(user_json.keys).not_to include("google_refresh_token")
      end
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/spec/serializers/sensitive_data_audit_spec.rb` | Automated check for sensitive attribute exposure |
| `apps/core/spec/requests/serializer_exposure_spec.rb` | Request-level verification of redacted responses |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/app/serializers/integration_config_serializer.rb` | Replace `settings` with `settings_summary` (redacted) |
| `apps/core/app/serializers/ai_provider_config_serializer.rb` | Replace `api_key` with `has_api_key`, `settings` with `settings_summary` |
| `apps/core/app/serializers/lti_registration_serializer.rb` | Replace `settings` with `settings_summary` (redacted) |
| `apps/core/app/serializers/ai_invocation_serializer.rb` | Replace `context` with `safe_context` (prompt redacted) |

## Definition of Done

- [ ] IntegrationConfigSerializer returns redacted settings (first 4 chars + asterisks)
- [ ] AiProviderConfigSerializer returns `has_api_key: true/false` instead of the actual key
- [ ] LtiRegistrationSerializer redacts secret values in settings
- [ ] AiInvocationSerializer redacts prompt content from context
- [ ] No serializer directly exposes: password, secret, token, api_key, access_token, refresh_token, private_key
- [ ] Automated test scans all serializers for forbidden attribute patterns
- [ ] Request test confirms raw secrets do not appear in API responses
- [ ] All existing tests updated if they assert on now-redacted fields
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
