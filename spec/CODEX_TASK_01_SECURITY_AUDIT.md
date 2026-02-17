# CODEX_TASK_01 — Security Audit (Backend Only)

**Priority:** P0
**Effort:** 6–8 hours
**Depends On:** None
**Branch:** `batch7/01-security-audit`

---

## Objective

Comprehensive security audit of the Rails backend and AI gateway. Verify all code added in Batches 4–6 meets security standards. Fix any issues found.

---

## Tasks

### 1. Dependency Vulnerability Scan

Run and fix dependency vulnerabilities:

```bash
cd apps/core && bundle audit check --update
cd apps/web && npm audit --production
cd apps/ai-gateway && pip-audit
```

**If vulnerabilities found:**
- Update the gem/package to a patched version
- If no patch exists, document the vulnerability and add a comment in the Gemfile/package.json noting the advisory and mitigation

Add a CI step to `.github/workflows/core.yml`:

```yaml
- name: Bundle Audit
  run: |
    gem install bundler-audit
    bundle audit check --update
```

### 2. Brakeman Static Analysis

Run Brakeman on the full Rails app:

```bash
cd apps/core && bundle exec brakeman --no-pager -q
```

**Fix every warning.** Common findings to look for:
- SQL injection in `.where()` calls using string interpolation — convert to parameterized queries
- Mass assignment — verify all `params.permit()` calls are restrictive
- File access — verify no user input in file paths
- Redirect — verify no open redirect vulnerabilities
- Cross-site scripting — verify no raw user input rendered

Add Brakeman to CI if not already present in `.github/workflows/core.yml`:

```yaml
- name: Brakeman
  run: bundle exec brakeman --no-pager -q --ensure-latest
```

### 3. RLS Policy Verification

Verify every table added in Batches 4–6 has a Row-Level Security policy. Check these tables specifically:

**Tables that MUST have RLS policies (verify each):**
- `resources` (Batch 6 — resource library)
- `resource_folders` (Batch 6)
- `resource_taggings` (Batch 6)
- `portfolios` (Batch 6 — student portfolio)
- `portfolio_entries` (Batch 6)
- `portfolio_comments` (Batch 6)
- `portfolio_shares` (Batch 6)
- `consent_records` (Batch 6 — FERPA compliance)
- `webhook_endpoints` (Batch 6 — webhooks)
- `webhook_deliveries` (Batch 6)
- `notification_preferences` (Batch 5)
- `guardian_links` (Batch 5)

For each table missing an RLS policy, create a migration:

```ruby
class AddRlsTo<TableName> < ActiveRecord::Migration[8.0]
  def up
    execute <<~SQL
      ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
      ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;

      CREATE POLICY tenant_isolation_policy ON <table_name>
        USING (tenant_id::text = current_setting('app.current_tenant_id', true));
    SQL
  end

  def down
    execute <<~SQL
      DROP POLICY IF EXISTS tenant_isolation_policy ON <table_name>;
      ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
    SQL
  end
end
```

**Write a verification test** in `apps/core/spec/models/rls_verification_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Row Level Security", type: :model do
  TENANT_SCOPED_TABLES = ActiveRecord::Base.connection.tables.reject { |t|
    %w[schema_migrations ar_internal_metadata tenants districts].include?(t)
  }

  TENANT_SCOPED_TABLES.each do |table|
    it "#{table} has RLS enabled" do
      result = ActiveRecord::Base.connection.execute(
        "SELECT relrowsecurity FROM pg_class WHERE relname = '#{table}'"
      )
      expect(result.first["relrowsecurity"]).to eq(true),
        "Table #{table} does not have Row Level Security enabled"
    end

    it "#{table} has a tenant_isolation_policy" do
      result = ActiveRecord::Base.connection.execute(
        "SELECT polname FROM pg_policy WHERE polrelid = '#{table}'::regclass"
      )
      policy_names = result.map { |r| r["polname"] }
      expect(policy_names).to include("tenant_isolation_policy"),
        "Table #{table} is missing tenant_isolation_policy"
    end
  end
end
```

### 4. Cookie Security Hardening

Update `apps/core/config/application.rb` or the session configuration:

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: "_k12_session",
  secure: Rails.env.production?,
  httponly: true,
  same_site: :lax,
  expire_after: 12.hours
```

Verify in `ApplicationController` that the session cookie settings are applied. If the app uses `ActionController::Cookies`, ensure:
- `httponly: true` on all cookies
- `secure: true` in production
- `same_site: :lax` or `:strict`

### 5. CSP Headers

Create `apps/core/config/initializers/content_security_policy.rb`:

```ruby
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self, "https://fonts.gstatic.com"
    policy.img_src     :self, :data, "https:", "blob:"
    policy.object_src  :none
    policy.script_src  :self
    policy.style_src   :self, :unsafe_inline, "https://fonts.googleapis.com"
    policy.connect_src :self, ENV["AI_GATEWAY_URL"].to_s
    policy.frame_src   :self, "https://docs.google.com", "https://drive.google.com"
  end

  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
  config.content_security_policy_nonce_directives = %w[script-src]
end
```

### 6. File Upload Validation

Find all models using Active Storage (`has_one_attached`, `has_many_attached`). For each, add content type and size validation.

Create `apps/core/app/models/concerns/attachment_validatable.rb`:

```ruby
module AttachmentValidatable
  extend ActiveSupport::Concern

  ALLOWED_IMAGE_TYPES = %w[image/jpeg image/png image/gif image/webp].freeze
  ALLOWED_DOCUMENT_TYPES = %w[
    application/pdf
    application/msword
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    application/vnd.ms-powerpoint
    application/vnd.openxmlformats-officedocument.presentationml.presentation
    text/plain text/csv
  ].freeze
  ALLOWED_TYPES = (ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES).freeze
  MAX_FILE_SIZE = 50.megabytes

  class_methods do
    def validates_attachment(attribute, content_types: ALLOWED_TYPES, max_size: MAX_FILE_SIZE)
      validate do
        attachment = send(attribute)
        next unless attachment.attached?

        unless content_types.include?(attachment.content_type)
          errors.add(attribute, "has an unsupported file type: #{attachment.content_type}")
        end

        if attachment.blob.byte_size > max_size
          errors.add(attribute, "is too large (max #{max_size / 1.megabyte}MB)")
        end
      end
    end
  end
end
```

Apply this concern to every model with Active Storage attachments. Search the codebase:

```bash
grep -rn "has_one_attached\|has_many_attached" apps/core/app/models/
```

For each model found, include the concern and add the validation:

```ruby
include AttachmentValidatable
validates_attachment :file  # or whatever the attachment name is
```

### 7. SSRF Prevention

Verify that any service making outbound HTTP requests validates the target URL. Check:
- `AiGatewayClient` — uses `ENV["AI_GATEWAY_URL"]` (safe — not user-controlled)
- `GoogleDriveService` — uses Google API client (safe)
- `GoogleClassroomService` — uses Google API client (safe)
- `OneRosterClient` — uses `integration_config.base_url` (tenant-controlled — needs validation)
- Webhook delivery (if webhooks are dispatched to user-provided URLs — needs validation)

For any service that makes requests to user-provided URLs, add URL validation:

Create `apps/core/app/validators/safe_url_validator.rb`:

```ruby
class SafeUrlValidator < ActiveModel::EachValidator
  BLOCKED_HOSTS = %w[localhost 127.0.0.1 0.0.0.0 ::1 metadata.google.internal 169.254.169.254].freeze

  def validate_each(record, attribute, value)
    return if value.blank?

    uri = URI.parse(value)

    unless %w[http https].include?(uri.scheme)
      record.errors.add(attribute, "must use http or https")
      return
    end

    if BLOCKED_HOSTS.include?(uri.host) || private_ip?(uri.host)
      record.errors.add(attribute, "cannot point to internal or private addresses")
    end
  rescue URI::InvalidURIError
    record.errors.add(attribute, "is not a valid URL")
  end

  private

  def private_ip?(host)
    addr = IPAddr.new(host)
    addr.private? || addr.loopback? || addr.link_local?
  rescue IPAddr::InvalidAddressError
    false
  end
end
```

Apply to webhook endpoint URLs and OneRoster base URLs:

```ruby
validates :url, safe_url: true
```

### 8. Rate Limiting Expansion

Update `apps/core/config/initializers/rack_attack.rb` to cover newer endpoints:

```ruby
# Webhook admin (prevent abuse of webhook management)
throttle("webhooks/ip", limit: 20, period: 60) do |req|
  req.ip if req.path.start_with?("/api/v1/webhook")
end

# Data compliance (FERPA export/delete are expensive)
throttle("compliance/ip", limit: 10, period: 60) do |req|
  req.ip if req.path.start_with?("/api/v1/compliance") || req.path.include?("data_export") || req.path.include?("data_deletion")
end

# Analytics (heavy DB queries)
throttle("analytics/ip", limit: 30, period: 60) do |req|
  req.ip if req.path.include?("analytics") || req.path.include?("progress")
end

# Portfolio (file-heavy)
throttle("portfolio/ip", limit: 30, period: 60) do |req|
  req.ip if req.path.start_with?("/api/v1/portfolios")
end
```

Add rate limit response headers. Update the Rack::Attack configuration:

```ruby
Rack::Attack.throttled_responder = lambda do |request|
  match_data = request.env["rack.attack.match_data"]
  now = match_data[:epoch_time]

  headers = {
    "Content-Type" => "application/json",
    "Retry-After" => (match_data[:period] - (now % match_data[:period])).to_s,
    "X-RateLimit-Limit" => match_data[:limit].to_s,
    "X-RateLimit-Remaining" => "0",
    "X-RateLimit-Reset" => (now + (match_data[:period] - (now % match_data[:period]))).to_s,
  }

  [429, headers, [{ error: "rate_limited", message: "Too many requests. Retry after #{headers['Retry-After']} seconds." }.to_json]]
end
```

### 9. Write Tests

**File: `apps/core/spec/models/rls_verification_spec.rb`**
- Already described in Task 3 above — verify RLS on all tenant-scoped tables

**File: `apps/core/spec/validators/safe_url_validator_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SafeUrlValidator do
  subject(:model) { validatable_class.new(url: url) }

  let(:validatable_class) do
    Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations
      attr_accessor :url
      validates :url, safe_url: true
    end
  end

  context "with valid HTTPS URL" do
    let(:url) { "https://example.com/webhook" }
    it { is_expected.to be_valid }
  end

  context "with localhost" do
    let(:url) { "http://localhost:3000/hook" }
    it { is_expected.not_to be_valid }
  end

  context "with 127.0.0.1" do
    let(:url) { "http://127.0.0.1/hook" }
    it { is_expected.not_to be_valid }
  end

  context "with AWS metadata IP" do
    let(:url) { "http://169.254.169.254/latest/meta-data/" }
    it { is_expected.not_to be_valid }
  end

  context "with private IP" do
    let(:url) { "http://10.0.0.1/hook" }
    it { is_expected.not_to be_valid }
  end

  context "with non-HTTP scheme" do
    let(:url) { "ftp://example.com/file" }
    it { is_expected.not_to be_valid }
  end
end
```

**File: `apps/core/spec/models/concerns/attachment_validatable_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe AttachmentValidatable do
  # Test with a model that has Active Storage attachments
  # Verify content type validation rejects executables
  # Verify size validation rejects files over 50MB
  # Verify allowed types pass validation
end
```

**File: `apps/core/spec/initializers/rack_attack_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Rack::Attack", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  before { mock_session(user, tenant: tenant) }
  after { Current.tenant = nil }

  describe "rate limiting" do
    it "returns 429 with rate limit headers when throttled" do
      # This test verifies the throttled_responder returns proper headers
      # Implementation depends on Rack::Attack test mode
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/config/initializers/content_security_policy.rb` | CSP headers |
| `apps/core/config/initializers/session_store.rb` | Secure cookie config |
| `apps/core/app/models/concerns/attachment_validatable.rb` | File upload validation |
| `apps/core/app/validators/safe_url_validator.rb` | SSRF prevention |
| `apps/core/spec/models/rls_verification_spec.rb` | RLS policy verification |
| `apps/core/spec/validators/safe_url_validator_spec.rb` | URL validator tests |
| `apps/core/spec/models/concerns/attachment_validatable_spec.rb` | Upload validation tests |
| `db/migrate/YYYYMMDDHHMMSS_add_rls_to_batch6_tables.rb` | RLS for new tables (if missing) |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/initializers/rack_attack.rb` | Add webhook, compliance, analytics, portfolio throttles; add response headers |
| `apps/core/Gemfile` | Add `bundler-audit` to development/test group |
| `.github/workflows/core.yml` | Add bundle-audit and brakeman steps |
| Any model with `has_one_attached`/`has_many_attached` | Add AttachmentValidatable concern |
| Any model with user-provided URLs | Add `validates :url, safe_url: true` |

---

## Definition of Done

- [ ] `bundle audit check` reports no high/critical vulnerabilities
- [ ] `bundle exec brakeman` reports zero warnings
- [ ] Every tenant-scoped table has RLS enabled with tenant_isolation_policy
- [ ] RLS verification spec passes for all tables
- [ ] Session cookies set HttpOnly, Secure (production), SameSite
- [ ] CSP headers configured
- [ ] All Active Storage attachments validated for content type and size
- [ ] SafeUrlValidator prevents SSRF on user-provided URLs
- [ ] Rate limiting covers webhooks, compliance, analytics, portfolio endpoints
- [ ] Rate limit response includes Retry-After and X-RateLimit headers
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
