class AlertEvaluationJob < ApplicationJob
  queue_as :default

  def perform
    health = SystemHealthService.check_all
    metrics = health[:metrics]

    AlertConfiguration.enabled.find_each do |config|
      current_value = metrics[config.metric.to_sym]
      next if current_value.nil?
      next if current_value.respond_to?(:negative?) && current_value.negative?
      next unless config.evaluate(current_value)
      next if config.in_cooldown?

      config.trigger!
      deliver_alert(config, current_value, health[:overall])
    end
  end

  private

  def deliver_alert(config, current_value, health_summary)
    case config.notification_channel
    when "slack"
      SlackNotifier.send_alert(
        name: config.name,
        metric: config.metric,
        current_value: current_value,
        threshold: config.threshold,
        comparison: config.comparison,
        severity: config.severity,
        health_summary: health_summary
      )
    when "email"
      Rails.logger.info(
        "[AlertEvaluationJob] Email channel not yet implemented for #{config.name} (#{config.metric})"
      )
    end
  end
end
