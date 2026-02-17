# CODEX_AUDIT_01 — Session, Cookie & Transport Security

**Priority:** CRITICAL
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/01-session-transport`

---

## Findings

The security audit identified these vulnerabilities:

1. **Cookie flags missing** — `config/application.rb:47` configures `CookieStore` with no `secure`, `httponly`, or `samesite` flags. XSS can steal session cookies via `document.cookie`. CSRF possible without `samesite`.
2. **SSL not enforced** — `config/environments/production.rb:25` has `config.force_ssl = true` commented out. Sessions can be intercepted over plain HTTP.
3. **No session expiry** — Cookie persists until browser close. Shared school computers remain logged in indefinitely.
4. **Testing sessions controller in production** — `apps/core/app/controllers/api/v1/testing/sessions_controller.rb` skips authentication and creates arbitrary user sessions by role name. If left enabled in production, anyone can impersonate any role.

---

## Fixes

### 1. Harden Session Cookie Configuration

**File: `apps/core/config/application.rb`**

Find the existing session store line:
```ruby
config.middleware.use ActionDispatch::Session::CookieStore, key: "_k12_lms_session"
```

Replace with:
```ruby
config.middleware.use ActionDispatch::Session::CookieStore,
  key: "_k12_lms_session",
  httponly: true,
  same_site: :lax,
  expire_after: 12.hours,
  secure: Rails.env.production?
```

### 2. Enable SSL in Production

**File: `apps/core/config/environments/production.rb`**

Find the commented-out line:
```ruby
# config.force_ssl = true
```

Uncomment it:
```ruby
config.force_ssl = true
```

Also add HSTS configuration directly below:
```ruby
config.ssl_options = { hsts: { subdomains: true, preload: true, expires: 1.year } }
```

### 3. Guard Testing Sessions Controller

**File: `apps/core/app/controllers/api/v1/testing/sessions_controller.rb`**

Add a production guard at the top of the class, before any actions:

Find the class definition (should be near the top):
```ruby
class Api::V1::Testing::SessionsController < ApplicationController
```

Add immediately after:
```ruby
  before_action :reject_in_production

  private

  def reject_in_production
    if Rails.env.production?
      head :not_found
      return
    end
  end

  public
```

This ensures the controller returns 404 in production even if someone discovers the route. Existing test/development behavior is preserved.

### 4. Add Session Timeout Enforcement in ApplicationController

**File: `apps/core/app/controllers/application_controller.rb`**

Add a session expiry check in the `authenticate_user!` method. Find the method and add session staleness check before user resolution:

After the `resolve_tenant` and `resolve_user` calls, before the `unless Current.user` check, add:

```ruby
    # Check session freshness
    if session[:last_seen_at] && session[:last_seen_at] < 12.hours.ago.to_i
      reset_session
      render json: { error: "Session expired" }, status: :unauthorized
      return
    end
    session[:last_seen_at] = Time.current.to_i
```

### 5. Add Security Headers Middleware

Create **`apps/core/config/initializers/security_headers.rb`**:

```ruby
Rails.application.config.action_dispatch.default_headers = {
  "X-Frame-Options" => "SAMEORIGIN",
  "X-Content-Type-Options" => "nosniff",
  "X-XSS-Protection" => "0",  # Disabled per modern best practice; CSP replaces it
  "X-Permitted-Cross-Domain-Policies" => "none",
  "Referrer-Policy" => "strict-origin-when-cross-origin",
  "Permissions-Policy" => "camera=(), microphone=(), geolocation=()",
}
```

### 6. Write Tests

**File: `apps/core/spec/requests/session_security_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Session Security", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "session expiry" do
    it "rejects sessions older than 12 hours" do
      mock_session(user, tenant: tenant)

      # Simulate an old session
      allow_any_instance_of(ApplicationController).to receive(:session).and_return(
        { user_id: user.id, tenant_id: tenant.id, last_seen_at: 13.hours.ago.to_i }
      )

      get "/api/v1/users"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "security headers" do
    it "includes X-Frame-Options" do
      mock_session(user, tenant: tenant)
      get "/api/v1/health"
      expect(response.headers["X-Frame-Options"]).to eq("SAMEORIGIN")
    end

    it "includes X-Content-Type-Options" do
      mock_session(user, tenant: tenant)
      get "/api/v1/health"
      expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
    end

    it "includes Referrer-Policy" do
      mock_session(user, tenant: tenant)
      get "/api/v1/health"
      expect(response.headers["Referrer-Policy"]).to eq("strict-origin-when-cross-origin")
    end
  end
end
```

**File: `apps/core/spec/requests/api/v1/testing/sessions_controller_spec.rb`**

If this file exists, add a test. If not, create it:

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Testing::Sessions", type: :request do
  describe "production guard" do
    it "returns 404 in production environment" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))

      post "/api/v1/testing/sessions", params: { role: "admin" }
      expect(response).to have_http_status(:not_found)
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/config/initializers/security_headers.rb` | Default security response headers |
| `apps/core/spec/requests/session_security_spec.rb` | Session expiry and header tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/application.rb` | Add `httponly`, `secure`, `same_site`, `expire_after` to cookie store |
| `apps/core/config/environments/production.rb` | Uncomment `force_ssl`, add HSTS config |
| `apps/core/app/controllers/api/v1/testing/sessions_controller.rb` | Add `reject_in_production` guard |
| `apps/core/app/controllers/application_controller.rb` | Add session staleness check |

## Definition of Done

- [ ] Session cookie has `httponly: true`, `same_site: :lax`, `secure: true` (production), `expire_after: 12.hours`
- [ ] `config.force_ssl = true` enabled in production with HSTS
- [ ] Testing sessions controller returns 404 in production
- [ ] Session expiry enforced at 12 hours via `last_seen_at` check
- [ ] Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) set
- [ ] All tests pass: `bundle exec rspec`
- [ ] `bundle exec rubocop` passes
