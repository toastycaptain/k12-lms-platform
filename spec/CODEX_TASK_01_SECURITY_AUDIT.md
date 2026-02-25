# CODEX_TASK_01 — Security Audit Final

**Priority:** P0
**Effort:** 2–3 hours remaining (partial implementation exists)
**Depends On:** None
**Branch:** `batch7/01-security-audit`

---

## Already Implemented — DO NOT REDO

The following were built in a prior session. Verify they exist before starting:

| File | Status |
|------|--------|
| `apps/core/app/validators/safe_url_validator.rb` | ✅ Exists — SSRF prevention with private IP blocklist |
| `apps/core/app/models/concerns/attachment_validatable.rb` | ✅ Exists — content type + size validation |
| `apps/core/config/initializers/rack_attack.rb` | ✅ Exists — rate limiting with throttles for auth, AI, uploads, webhooks, analytics |
| `apps/core/config/initializers/security_headers.rb` | ✅ Exists — X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Brakeman step in `.github/workflows/core.yml` | ✅ Exists |

Quick verification commands:
```bash
ls apps/core/app/validators/safe_url_validator.rb
ls apps/core/app/models/concerns/attachment_validatable.rb
ls apps/core/config/initializers/rack_attack.rb
ls apps/core/config/initializers/security_headers.rb
grep -n "brakeman" apps/core/.github/workflows/core.yml 2>/dev/null || grep -n "brakeman" .github/workflows/core.yml
```

---

## Remaining Tasks

### 1. Run Dependency Vulnerability Scans

Run the scans and fix any high/critical findings:

```bash
cd apps/core && bundle audit check --update
cd apps/web && npm audit --production
cd apps/ai-gateway && pip-audit
```

**If high/critical vulnerabilities are found:**
- Update the gem/package to the patched version
- If no patch exists, add a comment documenting the advisory and mitigation

Add bundle-audit to CI. Update `.github/workflows/core.yml` to add after the existing Brakeman step:

```yaml
- name: Bundle Audit
  run: |
    gem install bundler-audit
    bundle audit check --update
```

### 2. Run Brakeman and Fix All Warnings

```bash
cd apps/core && bundle exec brakeman --no-pager -q
```

Fix every warning output. Common findings to look for:
- SQL injection in `.where()` with string interpolation → convert to parameterized queries
- Mass assignment → verify all `params.permit()` calls are restrictive
- Open redirect → verify no user-controlled redirect targets
- Cross-site scripting → verify no raw user input rendered

The CI step already exists. The goal here is to confirm the scan runs clean with zero warnings.

### 3. Add CSP Headers

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

### 4. Harden Session Cookie Configuration

Create `apps/core/config/initializers/session_store.rb`:

```ruby
Rails.application.config.session_store :cookie_store,
  key: "_k12_session",
  secure: Rails.env.production?,
  httponly: true,
  same_site: :lax,
  expire_after: 12.hours
```

### 5. Write RLS Verification Spec

Create `apps/core/spec/models/rls_verification_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Row Level Security", type: :model do
  # Tables that are intentionally NOT tenant-scoped (system-level)
  SYSTEM_TABLES = %w[
    schema_migrations ar_internal_metadata tenants districts
    backup_records alert_configurations
  ].freeze

  let(:tenant_tables) do
    ActiveRecord::Base.connection.tables.reject do |t|
      SYSTEM_TABLES.include?(t)
    end
  end

  it "all tenant-scoped tables have RLS enabled" do
    tenant_tables.each do |table|
      result = ActiveRecord::Base.connection.execute(
        "SELECT relrowsecurity FROM pg_class WHERE relname = '#{table}'"
      )
      row = result.first
      next unless row  # skip if table not found in pg_class

      expect(row["relrowsecurity"]).to eq(true),
        "Table '#{table}' does not have Row Level Security enabled.\n" \
        "Add a migration: ALTER TABLE #{table} ENABLE ROW LEVEL SECURITY;"
    end
  end

  it "all tenant-scoped tables have a tenant_isolation_policy" do
    tenant_tables.each do |table|
      next unless ActiveRecord::Base.connection.column_exists?(table, :tenant_id)

      result = ActiveRecord::Base.connection.execute(
        "SELECT polname FROM pg_policy WHERE polrelid = '#{table}'::regclass"
      )
      policy_names = result.map { |r| r["polname"] }

      expect(policy_names).to include("tenant_isolation_policy"),
        "Table '#{table}' has tenant_id but is missing tenant_isolation_policy.\n" \
        "Add a migration enabling RLS and creating the policy."
    end
  end
end
```

### 6. Verify Existing Validators Are Applied to All Models

Check that `SafeUrlValidator` is applied to any model with user-provided URLs. Run:

```bash
grep -rn "has_one_attached\|has_many_attached" apps/core/app/models/ --include="*.rb"
```

For each model found, confirm `include AttachmentValidatable` and `validates_attachment :field_name` are present. If missing, add them.

Check that `validates :url, safe_url: true` (or equivalent) is on:
- `WebhookEndpoint` (or equivalent model for webhook URLs)
- `IntegrationConfig` (for OneRoster base_url)

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/config/initializers/content_security_policy.rb` | CSP headers |
| `apps/core/config/initializers/session_store.rb` | Secure cookie config |
| `apps/core/spec/models/rls_verification_spec.rb` | RLS policy verification |

## Files to Modify

| File | Change |
|------|--------|
| `.github/workflows/core.yml` | Add bundle-audit step after Brakeman |
| Any model missing AttachmentValidatable | Add concern and validates_attachment |
| Any model with user-provided URL missing safe_url validation | Add `validates :url, safe_url: true` |

---

## Definition of Done

- [ ] `bundle audit check --update` reports no high/critical vulnerabilities
- [ ] `bundle exec brakeman --no-pager -q` reports zero warnings
- [ ] Bundle-audit step added to `.github/workflows/core.yml`
- [ ] `content_security_policy.rb` initializer created
- [ ] `session_store.rb` sets Secure (production), HttpOnly, SameSite: lax
- [ ] `rls_verification_spec.rb` passes for all tenant-scoped tables
- [ ] All models with Active Storage attachments include AttachmentValidatable
- [ ] User-provided URLs in WebhookEndpoint and IntegrationConfig validated with SafeUrlValidator
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
