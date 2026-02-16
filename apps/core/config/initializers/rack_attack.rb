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

  # JSON 429 response
  self.throttled_responder = lambda do |_req|
    [ 429, { "Content-Type" => "application/json", "Retry-After" => "60" },
      [ '{"error":"Rate limit exceeded. Try again later."}' ] ]
  end
end
