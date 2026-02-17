class RequestTiming
  SLOW_REQUEST_THRESHOLD_MS = 500.0

  def initialize(app)
    @app = app
  end

  def call(env)
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    request_tags = build_request_tags(env)
    status = nil
    headers = nil
    body = nil

    status, headers, body = @app.call(env)

    duration_ms = elapsed_ms(started_at)
    headers["X-Request-Duration-Ms"] = duration_ms.to_s

    metric_tags = request_tags.merge(status: status.to_s)
    MetricsService.increment("http.request.total", tags: metric_tags)
    MetricsService.timing("http.request.duration_ms", duration_ms, tags: metric_tags)

    if status.to_i >= 500
      MetricsService.increment("http.request.server_error", tags: metric_tags)
    end

    if duration_ms > SLOW_REQUEST_THRESHOLD_MS
      Rails.logger.warn("SLOW REQUEST (#{duration_ms}ms): #{env['REQUEST_METHOD']} #{env['PATH_INFO']}")
    end

    [ status, headers, body ]
  rescue StandardError => e
    duration_ms = elapsed_ms(started_at)
    MetricsService.increment(
      "http.request.exception",
      tags: request_tags.merge(status: "exception", error: e.class.name)
    )
    MetricsService.timing(
      "http.request.duration_ms",
      duration_ms,
      tags: request_tags.merge(status: "exception")
    )
    raise
  end

  private

  def elapsed_ms(started_at)
    ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)
  end

  def build_request_tags(env)
    {
      method: env["REQUEST_METHOD"],
      path: env["PATH_INFO"],
      tenant_id: env["current_tenant_id"],
      user_id: env["current_user_id"]
    }
  end
end
