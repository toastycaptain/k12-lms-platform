Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  config.environment = Rails.env
  config.breadcrumbs_logger = [ :active_support_logger, :http_logger ]
  config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", 0.1).to_f
  config.send_default_pii = false
  config.before_send = lambda do |event, _hint|
    event.tags ||= {}
    event.tags.merge!(
      correlation_id: Current.correlation_id,
      trace_id: Current.trace_id,
      tenant_id: Current.tenant&.id,
      school_id: Current.school&.id
    )
    event.tags.compact!
    event
  end
end
