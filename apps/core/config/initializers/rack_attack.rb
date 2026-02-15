class Rack::Attack
  safelist("healthcheck") do |req|
    req.path == "/up"
  end

  throttle("addon/ip", limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/addon")
  end

  throttle("auth/ip", limit: 10, period: 60) do |req|
    req.ip if req.path.start_with?("/auth") && req.post?
  end

  throttle("api/ip", limit: 300, period: 60) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  self.throttled_responder = lambda do |_req|
    [
      429,
      { "Content-Type" => "application/json", "Retry-After" => "60" },
      [ '{"error":"Rate limit exceeded. Try again later."}' ]
    ]
  end
end
