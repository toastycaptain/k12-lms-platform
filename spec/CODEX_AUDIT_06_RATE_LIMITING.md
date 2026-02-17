# CODEX_AUDIT_06 — Rate Limiting Expansion

**Priority:** MEDIUM
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/06-rate-limiting`

---

## Findings

The security audit found:

1. **No per-user rate limiting** — Only IP-based throttling exists. A single authenticated user can make 300 requests/minute (5/sec) to any endpoint. On shared school networks (many students behind one IP), the IP-based limit is either too tight (blocks legitimate users) or too loose (single user spams).
2. **No file upload rate limiting** — Submission file uploads share the 300/min general API limit. A user could upload hundreds of files per minute.
3. **No search rate limiting** — `/api/v1/search` can be hit at 5 req/sec, enabling data enumeration.
4. **No rate limit response headers** — When throttled, the user gets a bare 429 with no `Retry-After`, `X-RateLimit-Limit`, or `X-RateLimit-Remaining` headers.
5. **CSV/export endpoints not limited** — Data export endpoints (FERPA, gradebook, QTI) trigger expensive DB queries and can be used for DoS.

---

## Fixes

### 1. Add Per-User Rate Limiting

**File: `apps/core/config/initializers/rack_attack.rb`**

Add these throttles to the existing file. Read the file first and append below the existing throttles:

```ruby
# --- Per-User Authenticated Rate Limits ---

# Helper to extract user_id from session
Rack::Attack.throttle("authenticated/user", limit: 120, period: 60) do |req|
  # 120 req/min per authenticated user (2 per second)
  next unless req.path.start_with?("/api/v1/")
  req.env["rack.session"]&.dig("user_id")
end

# File uploads: 10 per minute per user
Rack::Attack.throttle("uploads/user", limit: 10, period: 60) do |req|
  next unless req.post? || req.put? || req.patch?
  next unless req.content_type&.include?("multipart/form-data")
  req.env["rack.session"]&.dig("user_id") || req.ip
end

# Search: 30 per minute per user
Rack::Attack.throttle("search/user", limit: 30, period: 60) do |req|
  next unless req.path.start_with?("/api/v1/search")
  req.env["rack.session"]&.dig("user_id") || req.ip
end

# Data exports (expensive): 5 per minute per user
Rack::Attack.throttle("exports/user", limit: 5, period: 60) do |req|
  next unless req.path.match?(/export|compliance|gradebook.*export/)
  req.env["rack.session"]&.dig("user_id") || req.ip
end

# Bulk operations: 10 per minute per user
Rack::Attack.throttle("bulk/user", limit: 10, period: 60) do |req|
  next unless req.post?
  next unless req.path.match?(/bulk|batch|import/)
  req.env["rack.session"]&.dig("user_id") || req.ip
end

# Message sending: 30 per minute per user (prevent spam)
Rack::Attack.throttle("messages/user", limit: 30, period: 60) do |req|
  next unless req.post?
  next unless req.path.start_with?("/api/v1/messages") || req.path.include?("discussion_posts")
  req.env["rack.session"]&.dig("user_id") || req.ip
end
```

### 2. Add Rate Limit Response Headers

Add the throttled responder to the same file. Find if one already exists; if not, add:

```ruby
# --- Rate Limit Response Headers ---

Rack::Attack.throttled_responder = lambda do |request|
  match_data = request.env["rack.attack.match_data"]
  now = match_data[:epoch_time]
  period = match_data[:period]
  retry_after = (period - (now % period)).to_i

  headers = {
    "Content-Type" => "application/json",
    "Retry-After" => retry_after.to_s,
    "X-RateLimit-Limit" => match_data[:limit].to_s,
    "X-RateLimit-Remaining" => "0",
    "X-RateLimit-Reset" => (now + retry_after).to_s,
  }

  body = {
    error: "rate_limited",
    message: "Too many requests. Please retry after #{retry_after} seconds.",
    retry_after: retry_after,
  }.to_json

  [429, headers, [body]]
end
```

### 3. Add Rate Limit Info to Successful Responses

Create a middleware or after_action that adds rate limit headers to all responses (not just throttled ones). This helps clients proactively manage their request rate.

**File: `apps/core/app/controllers/concerns/rate_limit_headers.rb`**

```ruby
module RateLimitHeaders
  extend ActiveSupport::Concern

  included do
    after_action :set_rate_limit_headers
  end

  private

  def set_rate_limit_headers
    # Only add headers for API requests
    return unless request.path.start_with?("/api/")

    # General limit for context
    response.headers["X-RateLimit-Limit"] = "120"
    response.headers["X-RateLimit-Policy"] = "120;w=60"  # 120 per 60 seconds
  end
end
```

Include this in `ApplicationController`:

```ruby
include RateLimitHeaders
```

### 4. Add Blocklist for Repeated Offenders

Add to `rack_attack.rb`:

```ruby
# --- Blocklist Repeated Offenders ---

# Block IPs that trigger auth throttle 3 times in 10 minutes
Rack::Attack.blocklist("repeated_auth_abuse") do |req|
  Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 3, findtime: 10.minutes, bantime: 1.hour) do
    req.path.start_with?("/auth/") && req.env["rack.attack.matched"] == "auth/ip"
  end
end
```

### 5. Write Tests

**File: `apps/core/spec/initializers/rack_attack_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Rack::Attack Rate Limiting", type: :request do
  # Note: Testing Rack::Attack requires enabling it in test mode
  # or testing the configuration structure directly

  describe "configuration" do
    it "has auth rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("auth/ip")
    end

    it "has per-user rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("authenticated/user")
    end

    it "has upload rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("uploads/user")
    end

    it "has search rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("search/user")
    end

    it "has export rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("exports/user")
    end

    it "has message rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("messages/user")
    end

    it "has AI rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("ai/user")
    end
  end

  describe "throttled response" do
    it "returns JSON with rate limit headers" do
      # Verify the throttled responder returns correct format
      responder = Rack::Attack.throttled_responder
      expect(responder).to be_a(Proc)

      # Simulate a throttled request
      mock_request = double(
        env: {
          "rack.attack.match_data" => {
            epoch_time: Time.now.to_i,
            period: 60,
            limit: 120,
            count: 121,
          }
        }
      )

      status, headers, body = responder.call(mock_request)
      expect(status).to eq(429)
      expect(headers).to have_key("Retry-After")
      expect(headers).to have_key("X-RateLimit-Limit")
      expect(headers["X-RateLimit-Limit"]).to eq("120")

      parsed_body = JSON.parse(body.first)
      expect(parsed_body["error"]).to eq("rate_limited")
      expect(parsed_body["retry_after"]).to be_a(Integer)
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/concerns/rate_limit_headers.rb` | Response headers for rate limit info |
| `apps/core/spec/initializers/rack_attack_spec.rb` | Rate limiting configuration tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/initializers/rack_attack.rb` | Add per-user, upload, search, export, bulk, message throttles; add response headers; add blocklist |
| `apps/core/app/controllers/application_controller.rb` | Add `include RateLimitHeaders` |

## Definition of Done

- [ ] Per-user authenticated rate limit: 120 req/min
- [ ] File upload rate limit: 10 uploads/min per user
- [ ] Search rate limit: 30 req/min per user
- [ ] Data export rate limit: 5 req/min per user
- [ ] Message sending rate limit: 30 req/min per user
- [ ] Bulk operations rate limit: 10 req/min per user
- [ ] Throttled responses include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- [ ] Throttled response body is JSON with `error`, `message`, `retry_after`
- [ ] Rate limit configuration test verifies all throttles exist
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
