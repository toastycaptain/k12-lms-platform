# Codex Instructions — Auth & Session Hardening

## Objective

Close all authentication and session security gaps: verify the OAuth callback route exists in the web app, enforce CSRF protection on state-changing API endpoints, and ensure the login → session → API flow works end-to-end.

**Spec references:** TECH-2.3 (authentication), PRD-23 (security), P0-1 and P0-6 in PRIORITIZED_BACKLOG.md

---

## What Already Exists (DO NOT recreate)

### Backend
- `apps/core/app/controllers/api/v1/sessions_controller.rb` — `omniauth_callback`, `destroy`, `me`, `update_me`, `failure` actions
- `apps/core/config/routes.rb` — `/auth/:provider/callback` → `sessions#omniauth_callback`, `/auth/failure` → `sessions#failure`
- `apps/core/config/initializers/omniauth.rb` — OmniAuth Google + SAML config
- `apps/core/app/controllers/application_controller.rb` — sets `Current.user` from session, CSRF handling
- `apps/core/config/initializers/rack_attack.rb` — rate limiting on auth endpoints

### Frontend
- `apps/web/src/app/login/page.tsx` — login page with Google OAuth and SAML buttons
- `apps/web/src/lib/auth-context.tsx` — AuthProvider fetching `/api/v1/me`
- `apps/web/src/lib/api.ts` — `apiFetch` with credentials: "include"
- `apps/web/src/components/ProtectedRoute.tsx` — redirects unauthenticated users to /login

---

## Task 1: OAuth Callback Route in Web App

**Problem:** After Google OAuth, the browser is redirected to a callback URL. If the web app does not have a route at `/auth/callback`, the user gets a 404.

**Investigate:** Check if `apps/web/src/app/auth/callback/page.tsx` exists.

**If it does NOT exist, create:** `apps/web/src/app/auth/callback/page.tsx`

**Requirements:**
1. `"use client"` page that reads the URL search params (the Rails backend may redirect with a session cookie already set, or with error params)
2. On mount:
   - If error params present → display error message with "Try Again" link to `/login`
   - If no error → call `GET /api/v1/me` to verify session is established
   - If `/api/v1/me` succeeds → redirect to `/dashboard`
   - If `/api/v1/me` fails → display "Authentication failed" with "Try Again" link
3. Show a loading state while verifying the session
4. Handle edge case: if user is already authenticated, redirect immediately to `/dashboard`

**Also check:** `apps/web/next.config.ts` for any rewrites/redirects that might handle `/auth/callback`. If a rewrite to the Rails backend exists, the web page may not be needed (the Rails callback sets the cookie and redirects).

---

## Task 2: CSRF Protection Verification

**Problem:** The app uses cookie-based auth (`_k12_lms_session`). All state-changing requests (POST, PATCH, PUT, DELETE) must include a valid CSRF token to prevent cross-site request forgery.

**Investigate in `apps/core/app/controllers/application_controller.rb`:**
1. Check if `protect_from_forgery` is enabled
2. Check if API-mode Rails skips CSRF by default (Rails API-only apps do)
3. If CSRF is not enforced, determine the strategy:

**Option A (Recommended for API-only + cookie auth):** Use `protect_from_forgery with: :exception` and ensure the web app sends the CSRF token.

**Option B:** Use a custom CSRF token strategy with a dedicated endpoint:
- Add `GET /api/v1/csrf_token` that returns a CSRF token
- Web app fetches and includes it in `X-CSRF-Token` header on mutations

**Implementation:**

If Rails API-only mode skips CSRF, add to `ApplicationController`:
```ruby
include ActionController::RequestForgery
protect_from_forgery with: :exception, unless: -> { request.format.json? && valid_api_token? }
```

Or if using the meta-tag approach:
1. Add a `GET /api/v1/csrf` endpoint that returns `{ token: form_authenticity_token }`
2. In `apps/web/src/lib/api.ts`, modify `apiFetch` to:
   - Fetch CSRF token on first mutation request
   - Cache the token
   - Include `X-CSRF-Token` header on POST/PATCH/PUT/DELETE requests
   - Refresh token on 422 (token expired)

**Test:** Add a request spec that verifies:
- POST without CSRF token returns 422 or 403
- POST with valid CSRF token succeeds
- GET requests work without CSRF token

---

## Task 3: Session Lifecycle Hardening

**File:** `apps/core/app/controllers/api/v1/sessions_controller.rb`

**Verify and fix:**
1. `omniauth_callback` action:
   - Creates or finds the user by `auth.uid` + `auth.provider`
   - Sets `session[:user_id]`
   - Redirects to frontend callback URL (not to `/` which may not exist)
2. `destroy` action:
   - Clears session completely (`reset_session`)
   - Returns 200 (not redirect) for API calls
3. `me` action:
   - Returns 401 if no valid session (not 500)
   - Returns user data with roles

**Add request specs to `apps/core/spec/requests/api/v1/sessions_spec.rb`:**
1. Test that `GET /api/v1/me` without session returns 401
2. Test that `DELETE /api/v1/session` clears the session
3. Test that `GET /api/v1/me` after destroy returns 401
4. Test that the OmniAuth callback creates a user and establishes a session

---

## Task 4: API Base URL Consistency

**Problem:** Web app may have mixed API base URL defaults (`localhost:3001` vs `localhost:3000`).

**File:** `apps/web/src/lib/api.ts`

**Verify:**
1. `NEXT_PUBLIC_API_URL` environment variable is used consistently
2. No hardcoded `localhost:3001` or `localhost:3000` fallbacks in individual page files
3. All `apiFetch` calls go through the single API client

**Fix any inconsistencies found:**
- Grep for `localhost:3001`, `localhost:3000`, `http://` in all `apps/web/src/` files
- Replace with `apiFetch` calls using the centralized base URL

---

## Task 5: Rate Limiting Verification

**File:** `apps/core/config/initializers/rack_attack.rb`

**Verify:**
1. Auth endpoints (`/auth/*`) are rate-limited
2. API endpoints have general rate limiting
3. AI generation endpoints have specific rate limiting (they are expensive)

**If not configured, add:**
```ruby
Rack::Attack.throttle("auth/ip", limit: 5, period: 60) do |req|
  req.ip if req.path.start_with?("/auth/")
end

Rack::Attack.throttle("api/ip", limit: 300, period: 60) do |req|
  req.ip if req.path.start_with?("/api/v1/")
end

Rack::Attack.throttle("ai/user", limit: 20, period: 60) do |req|
  if req.path.start_with?("/api/v1/ai/") && req.post?
    req.env["rack.session"]&.dig("user_id")
  end
end
```

---

## Architecture Rules

1. Do NOT change the authentication strategy (keep cookie-based auth)
2. Do NOT add token-based auth (JWT) — that's a future consideration
3. CSRF protection must not break the existing frontend
4. All changes must be backward-compatible with current session behavior
5. Rate limits should be reasonable for school usage (300 req/min per IP for API is generous)

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/sessions_spec.rb spec/requests/api/v1/authentication_spec.rb
cd apps/web && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] OAuth callback route works (either in web or via Rails redirect)
- [ ] CSRF protection enforced on state-changing API endpoints
- [ ] Web app sends CSRF token with mutation requests
- [ ] Session lifecycle tested: create, verify, destroy
- [ ] No hardcoded API base URLs in frontend
- [ ] Rate limiting configured for auth, API, and AI endpoints
- [ ] All existing tests still pass
