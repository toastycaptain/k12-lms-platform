require_relative "production"

Rails.application.configure do
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
end
