class Rack::Attack
  throttle("addon/ip", limit: 60, period: 60) do |req|
    req.ip if req.path.start_with?("/api/v1/addon")
  end
end
