require "active_support/core_ext/integer/time"
require "uri"

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { "cache-control" => "public, max-age=#{1.year.to_i}" }

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.asset_host = "http://assets.example.com"

  # Assume all access to the app is happening through a SSL-terminating reverse proxy.
  # config.assume_ssl = true

  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Skip http-to-https redirect for the default health check endpoint.
  config.ssl_options = {
    hsts: { subdomains: true, preload: true, expires: 1.year },
    redirect: { exclude: ->(request) { request.path == "/up" } }
  }

  # Log to STDOUT with the current request id as a default log tag.
  config.log_tags = [ :request_id ]
  stdout_logger = ActiveSupport::Logger.new(STDOUT)
  stdout_logger.formatter = config.log_formatter
  config.logger = ActiveSupport::TaggedLogging.new(stdout_logger)

  # Change to "debug" to log everything (including potentially personally-identifiable information!).
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")

  # Prevent health checks from clogging up the logs.
  config.silence_healthcheck_path = "/up"

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Use Redis for caching (Railway provides a Redis instance).
  config.cache_store = :redis_cache_store, { url: ENV["REDIS_URL"], expires_in: 1.hour }

  # Use Sidekiq for Active Job (background processing).
  config.active_job.queue_adapter = :sidekiq

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [ :id ]

  # Enable DNS rebinding and Host header protections with an explicit allowlist.
  parse_hosts = lambda do |raw_value|
    raw_value.to_s.split(",").map(&:strip).filter_map do |entry|
      next if entry.blank?
      next entry if entry.start_with?("/") && entry.end_with?("/")

      begin
        uri = URI.parse(entry)
        uri.host.presence || entry
      rescue URI::InvalidURIError
        entry
      end
    end
  end

  parsed_hosts = [
    *parse_hosts.call(ENV["ALLOWED_HOSTS"]),
    *parse_hosts.call(ENV["RAILWAY_PUBLIC_DOMAIN"]),
    *parse_hosts.call(ENV["RAILWAY_PRIVATE_DOMAIN"]),
    *parse_hosts.call(ENV["RAILWAY_STATIC_URL"])
  ].uniq

  if parsed_hosts.empty?
    raise "Host allowlist is empty in production. Set ALLOWED_HOSTS or Railway host environment variables."
  end

  config.hosts = parsed_hosts.map do |host|
    if host.start_with?("/") && host.end_with?("/") && host.length > 2
      Regexp.new(host[1..-2])
    else
      host
    end
  end
  config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
end
