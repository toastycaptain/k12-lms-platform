# CODEX_SECURITY_AUDIT_FINAL — Comprehensive Pre-Launch Security Audit and Remediation

**Priority:** P0
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Security, Privacy), PRD-24 (Multi-tenancy bugs → strict scoping), TECH-2.11 (TLS, encryption)
**Depends on:** None

---

## Problem

The platform handles student PII (FERPA-protected data) and will be used by minors (COPPA). The last comprehensive security review was Batch 3 (RBAC Wave 2 + auth hardening). Since then, 3 additional batches have added significant surface area: webhooks, file uploads, portfolios, data export, consent records, and more. A final audit is required before real schools trust the platform with student data.

Known gaps to verify:
1. **Dependency vulnerabilities** — No recent Bundler Audit or npm audit run
2. **Brakeman scan** — Not run since Batch 3; new controllers may have issues
3. **CSP headers** — Content Security Policy not configured
4. **Cookie security flags** — HttpOnly, Secure, SameSite not verified on all cookies
5. **File upload validation** — Resource library accepts uploads; MIME validation, size limits, antivirus scanning not verified
6. **Webhook URL validation** — SSRF risk if internal URLs allowed
7. **RLS verification** — RLS added in Batch 6 but new tables (consent_records, resources, portfolios, webhooks) need verification
8. **Rate limiting coverage** — New endpoints (analytics, compliance, webhooks, portfolios) may not be rate-limited
9. **SQL injection** — Raw SQL in analytics aggregation services
10. **XSS** — User-generated content in portfolios, discussions, messages

---

## Tasks

### 1. Run Dependency Vulnerability Scans

Execute and remediate:

```bash
# Ruby dependencies
cd apps/core && bundle audit check --update

# Node dependencies
cd apps/web && npm audit
cd apps/web && npx audit-ci --moderate

# Python dependencies
cd apps/ai-gateway && pip-audit
```

**Actions:**
- Update all dependencies with known CVEs
- Pin versions for transitive dependencies with vulnerabilities
- Document any accepted risks with justification
- Add dependency scanning to CI pipeline (if not already present)

### 2. Run Brakeman Static Analysis

```bash
cd apps/core && bundle exec brakeman --no-pager -f json -o brakeman_report.json
```

Review and remediate all warnings, focusing on:
- SQL injection (especially in analytics services with raw SQL)
- Mass assignment (strong params)
- Cross-site scripting (serializer output)
- Command injection
- File access
- Redirect vulnerabilities

### 3. Implement Content Security Policy

Update `apps/web/src/middleware.ts` to add CSP headers:

```typescript
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://accounts.google.com https://*.googleapis.com",
  "frame-src https://accounts.google.com https://docs.google.com https://classroom.google.com",
  "frame-ancestors 'self' https://docs.google.com https://classroom.google.com",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

response.headers.set("Content-Security-Policy", cspHeader);
```

Exception for addon routes: allow Google Workspace iframes.

### 4. Verify Cookie Security Flags

Audit `apps/core/config/application.rb` and session configuration:

```ruby
# Verify these settings exist:
config.session_store :cookie_store,
  key: "_k12_lms_session",
  secure: Rails.env.production?,
  httponly: true,
  same_site: :lax,
  expire_after: 12.hours
```

Verify all custom cookies (CSRF token, locale preference) also have security flags.

### 5. Harden File Upload Validation

Update `apps/core/app/models/resource.rb` and Resource controller:

```ruby
# Allowed MIME types for K-12 content
ALLOWED_MIME_TYPES = %w[
  application/pdf
  image/jpeg image/png image/gif image/webp
  application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document
  application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  application/vnd.ms-powerpoint application/vnd.openxmlformats-officedocument.presentationml.presentation
  text/plain text/csv
  video/mp4 audio/mpeg audio/mp4
].freeze

MAX_FILE_SIZE = 100.megabytes

validate :file_type_allowed
validate :file_size_within_limit

private

def file_type_allowed
  return unless file.attached?
  unless ALLOWED_MIME_TYPES.include?(file.content_type)
    errors.add(:file, "type not allowed. Accepted: PDF, images, Office documents, text, CSV, video, audio")
  end
end

def file_size_within_limit
  return unless file.attached?
  if file.byte_size > MAX_FILE_SIZE
    errors.add(:file, "is too large. Maximum size: 100MB")
  end
end
```

Also verify that Active Storage content-type validation is server-side (not just client-side MIME type from upload).

### 6. Prevent SSRF in Webhook URLs

Update `apps/core/app/models/webhook_endpoint.rb`:

```ruby
validate :url_not_internal

private

def url_not_internal
  uri = URI.parse(url)
  return errors.add(:url, "must use HTTPS") unless uri.scheme == "https" || !Rails.env.production?

  resolved = Resolv.getaddresses(uri.host)
  resolved.each do |ip|
    addr = IPAddr.new(ip)
    if addr.private? || addr.loopback? || addr.link_local?
      errors.add(:url, "cannot point to internal or private addresses")
      return
    end
  end
rescue URI::InvalidURIError
  errors.add(:url, "is not a valid URL")
rescue Resolv::ResolvError
  errors.add(:url, "hostname could not be resolved")
end
```

### 7. Verify RLS on New Tables

Create `apps/core/spec/rls/batch6_tables_spec.rb`:

Test RLS isolation on all tables added in Batches 4–6:
- `consent_records`
- `resources`, `resource_folders`, `resource_attachments`
- `portfolios`, `portfolio_entries`, `portfolio_entry_standards`, `portfolio_comments`, `portfolio_templates`
- `webhook_endpoints`, `webhook_deliveries`
- `calendar_events` (Batch 4)

Each test: create record in tenant A, switch to tenant B, verify invisible.

### 8. Extend Rate Limiting

Update `apps/core/config/initializers/rack_attack.rb`:

```ruby
# Analytics endpoints (expensive queries)
throttle("analytics/ip", limit: 30, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/v1/analytics")
end

# Data compliance endpoints (sensitive operations)
throttle("compliance/ip", limit: 10, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/v1/data_compliance")
end

# Webhook management
throttle("webhooks/ip", limit: 20, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/v1/webhooks")
end

# File uploads
throttle("uploads/ip", limit: 10, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/v1/resources") && req.post?
end

# Portfolio operations
throttle("portfolios/ip", limit: 60, period: 1.minute) do |req|
  req.ip if req.path.start_with?("/api/v1/portfolios")
end
```

### 9. Sanitize User-Generated Content

Verify XSS protection on all user-generated content fields:
- Portfolio entry content and reflections
- Discussion posts and comments
- Message bodies
- Resource descriptions
- Webhook payload display in admin UI

Ensure Rails serializers use `sanitize()` or that the frontend uses `DOMPurify` or React's built-in escaping for all rendered user content.

### 10. Create Security Checklist Document

Create `docs/SECURITY_CHECKLIST.md`:

```markdown
# Pre-Launch Security Checklist

## Authentication
- [ ] Google OIDC callback validates state parameter
- [ ] SAML assertions validated against metadata
- [ ] Session expiry enforced (12 hours)
- [ ] CSRF tokens verified on all state-changing requests
- [ ] Middleware redirects unauthenticated users

## Authorization
- [ ] Pundit authorize called on every controller action
- [ ] Policy scopes applied on every index query
- [ ] RLS enabled on all tenant-scoped tables
- [ ] Admin-only endpoints verified

## Data Protection
- [ ] FERPA data export and deletion functional
- [ ] Consent records tracked for COPPA
- [ ] Student record access logged
- [ ] Active Record encryption enabled for sensitive fields
- [ ] Backup encryption verified

## Input Validation
- [ ] File uploads: MIME type, size, and content validation
- [ ] Webhook URLs: SSRF prevention
- [ ] SQL injection: No raw SQL without parameterization
- [ ] XSS: All user content sanitized
- [ ] Mass assignment: Strong params on all controllers

## Network
- [ ] CSP headers configured
- [ ] HSTS enabled
- [ ] Cookie security flags (HttpOnly, Secure, SameSite)
- [ ] CORS restricted to known origins
- [ ] Rate limiting on all endpoints

## Dependencies
- [ ] Bundler Audit clean
- [ ] npm audit clean
- [ ] pip-audit clean
- [ ] Brakeman clean (no high/critical warnings)
```

### 11. Add Tests

- `apps/core/spec/rls/batch6_tables_spec.rb` — RLS on all new tables
- `apps/core/spec/models/resource_upload_validation_spec.rb` — MIME type and size limits
- `apps/core/spec/models/webhook_endpoint_ssrf_spec.rb` — SSRF prevention
- `apps/web/src/middleware.test.ts` — Verify CSP headers present
- `apps/core/spec/security/rate_limiting_spec.rb` — Verify rate limits on new endpoints

---

## Files to Create

| File | Purpose |
|------|---------|
| `docs/SECURITY_CHECKLIST.md` | Pre-launch security checklist |
| `apps/core/spec/rls/batch6_tables_spec.rb` | RLS tests for Batch 4–6 tables |
| `apps/core/spec/security/rate_limiting_spec.rb` | Rate limit coverage tests |
| `apps/core/spec/models/webhook_endpoint_ssrf_spec.rb` | SSRF prevention tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/middleware.ts` | Add CSP headers |
| `apps/core/config/initializers/rack_attack.rb` | Extend rate limiting |
| `apps/core/app/models/resource.rb` | File upload validation |
| `apps/core/app/models/webhook_endpoint.rb` | SSRF prevention |
| `apps/core/config/application.rb` | Verify cookie security flags |
| `apps/core/Gemfile` | Add bundler-audit if missing |
| `.github/workflows/ci.yml` | Add dependency scanning step |

---

## Definition of Done

- [ ] Bundler Audit, npm audit, and pip-audit report zero high/critical vulnerabilities
- [ ] Brakeman reports zero high-confidence warnings
- [ ] CSP headers set on all responses (with Google Workspace exceptions)
- [ ] All cookies have HttpOnly, Secure (production), and SameSite flags
- [ ] File uploads validated: MIME type allowlist, 100MB size limit
- [ ] Webhook URLs validated against SSRF (no private/loopback IPs)
- [ ] RLS verified on all Batch 4–6 tables
- [ ] Rate limiting covers analytics, compliance, webhooks, uploads, and portfolio endpoints
- [ ] User-generated content sanitized against XSS
- [ ] Security checklist document complete and all items verified
- [ ] All new security tests pass
- [ ] No Rubocop violations, no TypeScript errors
