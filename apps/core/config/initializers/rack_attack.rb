class Rack::Attack
  # Auth endpoints — prevent credential stuffing
  throttle("auth/ip", limit: 5, period: 60) do |req|
    req.ip if req.path.start_with?("/auth/")
  end

  # Addon endpoints — external-facing
  throttle("addon/ip", limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/addon")
  end

  # AI generation — expensive operations
  throttle("ai/user", limit: 20, period: 60) do |req|
    next unless req.post?
    next unless req.path.start_with?("/api/v1/ai/") || req.path.start_with?("/api/v1/ai_invocations")

    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # General API — prevent abuse
  throttle("api/ip", limit: 300, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/")
  end

  # --- Per-User Authenticated Rate Limits ---

  # 120 req/min per authenticated user (2 per second)
  throttle("authenticated/user", limit: 120, period: 60) do |req|
    next unless req.path.start_with?("/api/v1/")
    req.env["rack.session"]&.dig("user_id")
  end

  # File uploads: 10 per minute per user
  throttle("uploads/user", limit: 10, period: 60) do |req|
    next unless req.post? || req.put? || req.patch?
    next unless req.content_type&.include?("multipart/form-data")
    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # Search: 30 per minute per user
  throttle("search/user", limit: 30, period: 60) do |req|
    next unless req.path.start_with?("/api/v1/search")
    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # Data exports (expensive): 5 per minute per user
  throttle("exports/user", limit: 5, period: 60) do |req|
    next unless req.path.match?(/export|compliance|gradebook.*export/)
    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # Bulk operations: 10 per minute per user
  throttle("bulk/user", limit: 10, period: 60) do |req|
    next unless req.post?
    next unless req.path.match?(/bulk|batch|import/)
    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # Message sending: 30 per minute per user (prevent spam)
  throttle("messages/user", limit: 30, period: 60) do |req|
    next unless req.post?
    next unless req.path.start_with?("/api/v1/messages") || req.path.include?("discussion_posts")
    req.env["rack.session"]&.dig("user_id") || req.ip
  end

  # --- Rate Limit Response Headers ---

  self.throttled_responder = lambda do |request|
    match_data = request.env["rack.attack.match_data"]
    now = match_data[:epoch_time]
    period = match_data[:period]
    retry_after = (period - (now % period)).to_i

    headers = {
      "Content-Type" => "application/json",
      "Retry-After" => retry_after.to_s,
      "X-RateLimit-Limit" => match_data[:limit].to_s,
      "X-RateLimit-Remaining" => "0",
      "X-RateLimit-Reset" => (now + retry_after).to_s
    }

    body = {
      error: "rate_limited",
      message: "Too many requests. Please retry after #{retry_after} seconds.",
      retry_after: retry_after
    }.to_json

    [ 429, headers, [ body ] ]
  end

  # --- Blocklist Repeated Offenders ---
  # Allow2Ban uses Rack::Attack.cache.store (Rails.cache). Skip in test to avoid
  # conflicts with specs that stub Rails.cache for other purposes.

  unless Rails.env.test?
    blocklist("repeated_auth_abuse") do |req|
      Rack::Attack::Allow2Ban.filter(req.ip, maxretry: 3, findtime: 10.minutes, bantime: 1.hour) do
        req.path.start_with?("/auth/") && req.env["rack.attack.matched"] == "auth/ip"
      end
    end
  end
end
