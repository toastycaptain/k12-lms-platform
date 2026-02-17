require "json"
require "time"

Rails.application.configure do
  config.log_tags = [
    :request_id,
    lambda { |request|
      "tenant:#{request.env['current_tenant_id'] || 'unknown'}"
    },
    lambda { |request|
      "user:#{request.env['current_user_id'] || 'unknown'}"
    }
  ]
end

if Rails.env.production?
  formatter = proc do |severity, time, _progname, msg|
    message =
      case msg
      when ::String
        msg
      when ::Hash
        msg
      else
        msg.to_s
      end

    JSON.dump(
      timestamp: time.utc.iso8601(3),
      level: severity,
      message: message,
      service: "k12-core",
      environment: Rails.env
    ) + "\n"
  end

  Rails.application.configure do
    config.log_formatter = formatter
    config.logger.formatter = formatter if config.logger.respond_to?(:formatter=)
  end
end
