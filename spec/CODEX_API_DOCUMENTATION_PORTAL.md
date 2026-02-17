# CODEX_API_DOCUMENTATION_PORTAL — Interactive API Docs, Auth Guide, and Integration Handbook

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.5 (OpenAPI schemas), TECH-2.6 (Key Endpoints), PRD-15 (Integrations)
**Depends on:** None

---

## Problem

The platform has OpenAPI specs (`core-v1.openapi.yaml`, `ai-gateway-v1.openapi.yaml`) covering ~100+ endpoints, but:

1. **No interactive docs** — developers must read raw YAML; no Swagger/Redoc UI
2. **No authentication guide** — external integrators don't know how to authenticate API calls
3. **No webhook integration guide** — webhook consumers need payload schemas and signature verification docs
4. **No rate limiting documentation** — API consumers don't know rate limits and will get blocked
5. **No error response documentation** — error codes and response shapes not documented
6. **No SDK examples** — no code examples for common integration patterns
7. **No API changelog** — no versioning strategy or deprecation notices

---

## Tasks

### 1. Set Up Redoc or Swagger UI

Create `apps/web/src/app/docs/api/page.tsx`:

```typescript
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <div>Loading API documentation...</div>,
});

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">K-12 LMS API Documentation</h1>
        <p className="text-gray-600">REST API reference for integrators and developers</p>
        <nav className="mt-4 flex gap-4">
          <a href="/docs/api" className="font-medium text-blue-600">API Reference</a>
          <a href="/docs/api/auth" className="text-gray-600 hover:text-blue-600">Authentication</a>
          <a href="/docs/api/webhooks" className="text-gray-600 hover:text-blue-600">Webhooks</a>
          <a href="/docs/api/rate-limits" className="text-gray-600 hover:text-blue-600">Rate Limits</a>
          <a href="/docs/api/errors" className="text-gray-600 hover:text-blue-600">Errors</a>
          <a href="/docs/api/changelog" className="text-gray-600 hover:text-blue-600">Changelog</a>
        </nav>
      </header>
      <SwaggerUI url="/api/v1/openapi.json" />
    </div>
  );
}
```

Add endpoint to serve OpenAPI spec as JSON:
```ruby
# GET /api/v1/openapi.json
def openapi
  spec = Rails.root.join("../../packages/contracts/core-v1.openapi.yaml")
  render json: YAML.load_file(spec)
end
```

### 2. Create Authentication Guide

Create `apps/web/src/app/docs/api/auth/page.tsx`:

Document with code examples:
- **Session-based auth** (for web applications)
  - POST to `/auth/google` → receive session cookie
  - Include cookie in subsequent requests
- **API token auth** (for server-to-server)
  - Generate API key in Admin > Integrations
  - Include as `Authorization: Bearer <token>` header
- **Webhook signature verification**
  - HMAC-SHA256 signature in `X-K12-Signature` header
  - Verification code examples in Ruby, Node.js, Python
- **OAuth scopes** — what each role can access
- **CORS policy** — allowed origins

### 3. Create Webhook Integration Guide

Create `apps/web/src/app/docs/api/webhooks/page.tsx`:

Document:
- **Available event types** — full list with payload schemas
- **Setting up a webhook** — API call or admin UI
- **Payload format** — common fields (event_type, timestamp, data)
- **Signature verification** — step-by-step with code examples:
  ```javascript
  const crypto = require("crypto");
  const signature = req.headers["x-k12-signature"];
  const timestamp = req.headers["x-k12-timestamp"];
  const payload = JSON.stringify(req.body);
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  ```
- **Retry policy** — 5 attempts with exponential backoff
- **Auto-disable** — after 10 consecutive failures
- **Testing** — use the test ping endpoint
- **Example payloads** — for each event type

### 4. Create Rate Limits Documentation

Create `apps/web/src/app/docs/api/rate-limits/page.tsx`:

| Endpoint Category | Limit | Window | Response |
|-------------------|-------|--------|----------|
| Authentication | 5 req | 1 min | 429 |
| General API | 60 req | 1 min | 429 |
| AI generation | 10 req | 1 min | 429 |
| Analytics | 30 req | 1 min | 429 |
| File uploads | 10 req | 1 min | 429 |
| Webhooks admin | 20 req | 1 min | 429 |
| Data compliance | 10 req | 1 min | 429 |

Document:
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 response format
- Best practices for handling rate limits

### 5. Create Error Reference

Create `apps/web/src/app/docs/api/errors/page.tsx`:

| Status | Code | Description |
|--------|------|-------------|
| 400 | bad_request | Request body invalid |
| 401 | unauthorized | Authentication required |
| 403 | forbidden | Insufficient permissions |
| 404 | not_found | Resource not found |
| 409 | conflict | Resource state conflict |
| 422 | unprocessable_entity | Validation failed |
| 429 | rate_limited | Too many requests |
| 500 | internal_error | Server error |

Document:
- Error response shape: `{ "error": "code", "message": "description", "details": {} }`
- Validation error details format
- How to report bugs

### 6. Create API Changelog

Create `apps/web/src/app/docs/api/changelog/page.tsx`:

```markdown
## v1 (Current)
- 2026-02-17: Webhook events system (20 event types)
- 2026-02-17: Portfolio endpoints
- 2026-02-17: Resource library endpoints
- 2026-02-17: Data compliance endpoints (FERPA export/delete)
- 2026-02-17: Version diff endpoints
- 2026-02-17: Analytics and progress endpoints

## Deprecation Policy
- Deprecated endpoints will return `Deprecation: true` header
- Deprecated endpoints continue to work for 6 months
- Breaking changes only in major versions (v2)
```

### 7. Add API Documentation Link

- Add "API Docs" link in footer of all pages
- Add link in Admin > Integrations page
- Make docs pages public (no auth required) — they are reference documentation

### 8. Add Tests

- `apps/web/src/app/docs/api/page.test.tsx` — Swagger UI renders
- `apps/web/src/app/docs/api/auth/page.test.tsx` — Auth guide renders code examples
- `apps/web/src/app/docs/api/webhooks/page.test.tsx` — Webhook guide renders

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/app/docs/api/page.tsx` | Interactive Swagger UI |
| `apps/web/src/app/docs/api/auth/page.tsx` | Authentication guide |
| `apps/web/src/app/docs/api/webhooks/page.tsx` | Webhook integration guide |
| `apps/web/src/app/docs/api/rate-limits/page.tsx` | Rate limit documentation |
| `apps/web/src/app/docs/api/errors/page.tsx` | Error code reference |
| `apps/web/src/app/docs/api/changelog/page.tsx` | API changelog |
| `apps/web/src/app/docs/api/layout.tsx` | Shared docs layout with nav |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Add swagger-ui-react |
| `apps/core/config/routes.rb` | Add openapi.json endpoint |
| `apps/web/src/middleware.ts` | Allow /docs/* without auth |
| `apps/core/config/initializers/rack_attack.rb` | Add rate limit response headers |

---

## Definition of Done

- [ ] Swagger UI renders full OpenAPI spec interactively at /docs/api
- [ ] Authentication guide covers session, token, and webhook signature auth
- [ ] Webhook guide documents all 20 event types with payload schemas
- [ ] Rate limits documented per endpoint category with response headers
- [ ] Error reference covers all HTTP status codes with response shapes
- [ ] API changelog tracks all endpoint additions
- [ ] Documentation pages are public (no auth required)
- [ ] All frontend tests pass
- [ ] No TypeScript errors
