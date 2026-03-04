class UptimeMonitorJob < ApplicationJob
  queue_as :default

  def perform
    monitored_endpoints.each do |endpoint|
      check_endpoint(endpoint[:name], endpoint[:url])
    end
  end

  private

  def monitored_endpoints
    endpoints = []
    core_url = resolved_core_url

    if core_url.present?
      endpoints << { name: "Core API Health", url: "#{core_url}/api/v1/health" }
    else
      Rails.logger.warn("[UptimeMonitorJob] Core API Health skipped: CORE_URL not configured")
    end

    ai_gateway_url = normalize_base_url(ENV["AI_GATEWAY_URL"])
    if ai_gateway_url.present?
      endpoints << { name: "AI Gateway Health", url: "#{ai_gateway_url}/v1/health" }
    else
      Rails.logger.info(
        "[UptimeMonitorJob] AI Gateway Health skipped: AI_GATEWAY_URL not configured"
      )
    end

    endpoints
  end

  def resolved_core_url
    explicit_core_url = normalize_base_url(ENV["CORE_URL"])
    return explicit_core_url if explicit_core_url.present?

    railway_core_url = normalize_base_url(ENV["RAILWAY_SERVICE_K12_CORE_URL"])
    return railway_core_url if railway_core_url.present?

    return nil if Rails.env.production?

    "http://localhost:3000"
  end

  def normalize_base_url(value)
    normalized = value.to_s.strip.sub(%r{/+\z}, "")
    return nil if normalized.blank?

    return normalized if normalized.match?(%r{\Ahttps?://}i)

    "https://#{normalized}"
  end

  def check_endpoint(name, url)
    start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    response = Faraday.get(url) { |request| request.options.timeout = 10 }
    latency_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round(2)

    if response.status == 200
      Rails.logger.info("[UptimeMonitorJob] #{name} OK (#{latency_ms}ms)")
      return
    end

    Rails.logger.warn("[UptimeMonitorJob] #{name} returned #{response.status} (#{latency_ms}ms)")
    SlackNotifier.send_alert(
      name: "Uptime: #{name}",
      metric: "http_status",
      current_value: response.status,
      threshold: 200,
      comparison: "eq",
      severity: "critical",
      health_summary: "#{name} returned #{response.status}"
    )
  rescue Faraday::Error => e
    Rails.logger.error("[UptimeMonitorJob] #{name} unreachable: #{e.message}")
    SlackNotifier.send_alert(
      name: "Uptime: #{name}",
      metric: "connectivity",
      current_value: 0,
      threshold: 1,
      comparison: "lt",
      severity: "critical",
      health_summary: "#{name} unreachable: #{e.message}"
    )
  end
end
