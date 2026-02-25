class SlackNotifier
  SEVERITY_EMOJI = {
    "info" => ":information_source:",
    "warning" => ":warning:",
    "critical" => ":rotating_light:"
  }.freeze

  class << self
    def send_alert(name:, metric:, current_value:, threshold:, comparison:, severity:, health_summary:)
      return if webhook_url.blank?

      emoji = SEVERITY_EMOJI.fetch(severity, ":bell:")
      text = [
        "#{emoji} *#{severity.to_s.upcase}: #{name}*",
        "> Metric: `#{metric}` = `#{current_value}` (threshold: #{comparison} #{threshold})",
        "> System: #{health_summary}",
        "> Time: #{Time.current.iso8601}"
      ].join("\n")

      send_message(text: text)
    end

    def send_message(text:)
      return if webhook_url.blank?

      Faraday.post(webhook_url) do |request|
        request.headers["Content-Type"] = "application/json"
        request.body = { text: text }.to_json
        request.options.timeout = 5
      end
    rescue Faraday::Error => e
      Rails.logger.error("[SlackNotifier] Failed to send message: #{e.message}")
    end

    private

    def webhook_url
      ENV["SLACK_ALERT_WEBHOOK_URL"]
    end
  end
end
