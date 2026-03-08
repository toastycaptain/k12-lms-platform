return unless defined?(ActiveSupport::Notifications)

ActiveSupport::Notifications.subscribe("sql.active_record") do |*args|
  event = ActiveSupport::Notifications::Event.new(*args)
  payload = event.payload
  next if payload[:cached]
  next if payload[:name].to_s == "SCHEMA"

  duration_ms = event.duration.to_f.round(1)
  MetricsService.timing(
    "db.query.duration_ms",
    duration_ms,
    tags: {
      name: payload[:name],
      request_id: Current.request_id,
      correlation_id: Current.correlation_id
    }
  )

  next unless duration_ms >= 250

  Rails.logger.warn(
    {
      event: "db.query.slow",
      duration_ms: duration_ms,
      sql: payload[:sql].to_s.squish.truncate(240),
      request_id: Current.request_id,
      correlation_id: Current.correlation_id,
      trace_id: Current.trace_id
    }.to_json
  )
end
