class UptimeMonitorJob < ApplicationJob
  queue_as :default

  ENDPOINTS = [
    {
      name: "Core API Health",
      url: -> { "#{ENV.fetch('CORE_URL', 'http://localhost:3000')}/api/v1/health" }
    },
    {
      name: "AI Gateway Health",
      url: -> { "#{ENV.fetch('AI_GATEWAY_URL', 'http://localhost:8000')}/v1/health" }
    }
  ].freeze

  def perform
    ENDPOINTS.each do |endpoint|
      check_endpoint(endpoint[:name], endpoint[:url].call)
    end
  end

  private

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
