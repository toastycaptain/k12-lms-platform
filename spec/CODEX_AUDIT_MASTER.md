# Security Audit — Master Execution Plan

**Total Tasks:** 7
**Estimated Total Effort:** 14–21 hours
**Execution Order:** Sequential (CRITICAL → HIGH → MEDIUM)

---

## IMPORTANT: Read Before Starting

1. Execute tasks **in order** (01 → 02 → 03 → 04 → 05 → 06 → 07).
2. Each task is on its **own branch**, created from `main`.
3. After completing each task: **commit, push, and merge to main** before starting the next.
4. Run the full test suite after each task to ensure no regressions.
5. Read each task file completely before writing any code.

---

## Execution Sequence

### Task 1: Session & Transport Security (CRITICAL)

**File:** `spec/CODEX_AUDIT_01_SESSION_TRANSPORT.md`
**Branch:** `audit/01-session-transport`

```bash
git checkout main && git pull origin main
git checkout -b audit/01-session-transport
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-01): harden session cookies, enforce SSL, guard test controller, add security headers

- Set httponly, secure, samesite=lax, expire_after on cookie store
- Uncomment force_ssl in production config
- Guard testing/sessions_controller behind Rails.env.test?
- Add session staleness check (12h expiry)
- Add security headers initializer (X-Frame-Options, X-Content-Type-Options, etc.)
- Add session security tests

Ref: CODEX_AUDIT_01_SESSION_TRANSPORT"
git push -u origin audit/01-session-transport
git checkout main && git merge audit/01-session-transport && git push origin main
```

---

### Task 2: File Upload Hardening (CRITICAL)

**File:** `spec/CODEX_AUDIT_02_FILE_UPLOADS.md`
**Branch:** `audit/02-file-uploads`

```bash
git checkout main && git pull origin main
git checkout -b audit/02-file-uploads
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-02): add file upload validation — content-type whitelist, size limits, extension blocklist

- Create AttachmentValidatable concern
- Apply to Submission (50MB, documents + images)
- Apply to LessonPlan, UnitPlan (PDF only, 100MB)
- Apply to QuestionBank (export types, 100MB)
- Block dangerous extensions (.exe, .sh, .php, etc.)
- Add attachment validation tests

Ref: CODEX_AUDIT_02_FILE_UPLOADS"
git push -u origin audit/02-file-uploads
git checkout main && git merge audit/02-file-uploads && git push origin main
```

---

### Task 3: Mass Assignment & Strong Parameters (CRITICAL)

**File:** `spec/CODEX_AUDIT_03_MASS_ASSIGNMENT.md`
**Branch:** `audit/03-mass-assignment`

```bash
git checkout main && git pull origin main
git checkout -b audit/03-mass-assignment
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-03): replace open hash permits and to_unsafe_h with explicit strong parameters

- Replace settings: {} with explicit keys in integration_configs, lti_registrations, resource_links controllers
- Replace preferences: {} with explicit keys in sessions controller
- Replace to_unsafe_h with explicit permit in drive, addon, ai_invocations controllers
- Add settings key whitelist validation on IntegrationConfig model
- Add codebase audit test scanning for open permits and to_unsafe_h

Ref: CODEX_AUDIT_03_MASS_ASSIGNMENT"
git push -u origin audit/03-mass-assignment
git checkout main && git merge audit/03-mass-assignment && git push origin main
```

---

### Task 4: Serializer Data Exposure (HIGH)

**File:** `spec/CODEX_AUDIT_04_SERIALIZER_EXPOSURE.md`
**Branch:** `audit/04-serializer-exposure`

```bash
git checkout main && git pull origin main
git checkout -b audit/04-serializer-exposure
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-04): redact sensitive data from API serializers

- Replace raw settings with settings_summary (first 4 chars + asterisks) in IntegrationConfigSerializer
- Replace api_key with has_api_key boolean in AiProviderConfigSerializer
- Redact secret values in LtiRegistrationSerializer
- Replace context with safe_context (prompt content redacted) in AiInvocationSerializer
- Add automated serializer audit test scanning for forbidden attribute patterns
- Add request test verifying raw secrets do not appear in API responses

Ref: CODEX_AUDIT_04_SERIALIZER_EXPOSURE"
git push -u origin audit/04-serializer-exposure
git checkout main && git merge audit/04-serializer-exposure && git push origin main
```

---

### Task 5: SSRF Prevention & URL Validation (MEDIUM)

**File:** `spec/CODEX_AUDIT_05_SSRF_PREVENTION.md`
**Branch:** `audit/05-ssrf-prevention`

```bash
git checkout main && git pull origin main
git checkout -b audit/05-ssrf-prevention
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-05): add SSRF prevention with SafeUrlValidator

- Create SafeUrlValidator blocking localhost, private IPs, cloud metadata, non-HTTP schemes
- Apply to IntegrationConfig base_url at model level
- Apply to LtiRegistration URL fields (jwks_url, auth_login_url, auth_token_url)
- Add runtime SSRF guard in OneRosterClient initializer
- Add SSRF guard before LTI JWKS fetch in launches_controller
- Add SafeUrlValidator tests and OneRosterClient SSRF tests

Ref: CODEX_AUDIT_05_SSRF_PREVENTION"
git push -u origin audit/05-ssrf-prevention
git checkout main && git merge audit/05-ssrf-prevention && git push origin main
```

---

### Task 6: Rate Limiting Expansion (MEDIUM)

**File:** `spec/CODEX_AUDIT_06_RATE_LIMITING.md`
**Branch:** `audit/06-rate-limiting`

```bash
git checkout main && git pull origin main
git checkout -b audit/06-rate-limiting
```

Complete all fixes in the task file, then:

```bash
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop -A
git add -A
git commit -m "security(audit-06): expand rate limiting with per-user throttles and response headers

- Add per-user authenticated rate limit (120 req/min)
- Add file upload rate limit (10/min per user)
- Add search rate limit (30/min per user)
- Add data export rate limit (5/min per user)
- Add message sending rate limit (30/min per user)
- Add bulk operations rate limit (10/min per user)
- Add throttled response with Retry-After, X-RateLimit-* headers and JSON body
- Add RateLimitHeaders concern for rate limit info on successful responses
- Add blocklist for repeated auth offenders
- Add rate limiting configuration tests

Ref: CODEX_AUDIT_06_RATE_LIMITING"
git push -u origin audit/06-rate-limiting
git checkout main && git merge audit/06-rate-limiting && git push origin main
```

---

### Task 7: AI Gateway Security Hardening (MEDIUM)

**File:** `spec/CODEX_AUDIT_07_AI_GATEWAY.md`
**Branch:** `audit/07-ai-gateway`

```bash
git checkout main && git pull origin main
git checkout -b audit/07-ai-gateway
```

Complete all fixes in the task file, then:

```bash
cd apps/ai-gateway && python -m pytest
cd apps/ai-gateway && python -m ruff check .
git add -A
git commit -m "security(audit-07): harden AI gateway auth, safety filters, and streaming output

- Enforce service_token in production (reject if unset)
- Use hmac.compare_digest for timing-safe token comparison
- Add output safety check to streaming endpoint
- Sanitize error messages to prevent internal detail leakage
- Protect /v1/providers endpoint with auth
- Minimize /v1/health info exposure (count not names)
- Restrict context field to scalar values
- Expand safety filter patterns (14 input, 8 output)
- Add auth security, expanded filter, and stream safety tests

Ref: CODEX_AUDIT_07_AI_GATEWAY"
git push -u origin audit/07-ai-gateway
git checkout main && git merge audit/07-ai-gateway && git push origin main
```

---

## Final Verification

After all 7 tasks are complete and merged to `main`:

```bash
git checkout main && git pull origin main

# Run full Rails test suite
cd apps/core && bundle exec rspec

# Run Rails linter
cd apps/core && bundle exec rubocop

# Run AI gateway tests
cd apps/ai-gateway && python -m pytest

# Run AI gateway linter
cd apps/ai-gateway && python -m ruff check .
```

All checks must pass green.

---

## Summary Table

| # | Task | Priority | Branch | Key Changes |
|---|------|----------|--------|-------------|
| 1 | Session & Transport | CRITICAL | `audit/01-session-transport` | Cookie flags, SSL, test controller guard, security headers |
| 2 | File Uploads | CRITICAL | `audit/02-file-uploads` | Content-type whitelist, size limits, extension blocklist |
| 3 | Mass Assignment | CRITICAL | `audit/03-mass-assignment` | Explicit strong params, eliminate `to_unsafe_h`, model validation |
| 4 | Serializer Exposure | HIGH | `audit/04-serializer-exposure` | Redact secrets from all serializers, automated audit test |
| 5 | SSRF Prevention | MEDIUM | `audit/05-ssrf-prevention` | SafeUrlValidator, block internal URLs in OneRoster/LTI |
| 6 | Rate Limiting | MEDIUM | `audit/06-rate-limiting` | Per-user throttles, response headers, blocklist |
| 7 | AI Gateway | MEDIUM | `audit/07-ai-gateway` | Timing-safe auth, stream safety, filter expansion |
