class RequestTiming
  SLOW_REQUEST_THRESHOLD_MS = 500.0

  def initialize(app)
    @app = app
  end

  def call(env)
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    status, headers, body = @app.call(env)
    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(1)

    headers["X-Request-Duration-Ms"] = duration.to_s

    if duration > SLOW_REQUEST_THRESHOLD_MS
      Rails.logger.warn("SLOW REQUEST (#{duration}ms): #{env['REQUEST_METHOD']} #{env['PATH_INFO']}")
    end

    [ status, headers, body ]
  end
end
