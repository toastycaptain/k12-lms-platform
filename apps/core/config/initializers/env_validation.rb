# frozen_string_literal: true

require "uri"

# Environment variable validation — runs on boot
#
# Required vars raise in production (fail closed).
# Recommended vars cause a logged info message if missing.
# A startup summary is always logged.

Rails.application.config.after_initialize do
  next if Rails.env.test? && !ENV["VALIDATE_ENV_IN_TEST"]

  logger = Rails.logger || Logger.new($stdout)
  parse_bool = ->(value) { ActiveModel::Type::Boolean.new.cast(value) }

  required_vars = %w[DATABASE_URL REDIS_URL SECRET_KEY_BASE]

  if Rails.env.production?
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

    required_vars += %w[CORS_ORIGINS FRONTEND_URL]
    missing_required = required_vars.select { |var| ENV[var].blank? }
    if missing_required.any?
      raise "Missing required environment variables in production: #{missing_required.join(', ')}"
    end

    host_allowlist = [
      *parse_hosts.call(ENV["ALLOWED_HOSTS"]),
      *parse_hosts.call(ENV["RAILWAY_PUBLIC_DOMAIN"]),
      *parse_hosts.call(ENV["RAILWAY_PRIVATE_DOMAIN"]),
      *parse_hosts.call(ENV["RAILWAY_STATIC_URL"])
    ].uniq

    if host_allowlist.empty?
      raise "Host allowlist is empty in production. Set ALLOWED_HOSTS or Railway host environment variables."
    end

    auth_bypass_enabled = parse_bool.call(ENV["AUTH_BYPASS_MODE"])
    allow_auth_bypass_in_production = parse_bool.call(ENV["ALLOW_AUTH_BYPASS_IN_PRODUCTION"])

    if auth_bypass_enabled && !allow_auth_bypass_in_production
      raise "AUTH_BYPASS_MODE in production requires ALLOW_AUTH_BYPASS_IN_PRODUCTION=true"
    end

    if auth_bypass_enabled && ENV["AUTH_BYPASS_USER_EMAIL"].to_s.strip.blank?
      raise "AUTH_BYPASS_USER_EMAIL must be set when AUTH_BYPASS_MODE is enabled in production"
    end

    if ENV["CORS_ORIGINS"].to_s.split(",").map(&:strip).any? { |origin| origin == "*" }
      raise "CORS_ORIGINS must not include '*' in production"
    end
  end

  recommended_vars = %w[SENTRY_DSN CORS_ORIGINS FRONTEND_URL]
  missing_recommended = recommended_vars.select { |var| ENV[var].blank? }
  if missing_recommended.any? && !Rails.env.test?
    logger.info(
      "Missing recommended environment variables: #{missing_recommended.join(', ')}. " \
      "These are optional but improve observability and security.",
    )
  end

  unless Rails.env.test?
    tenant_count = begin
      Tenant.unscoped.count
    rescue StandardError
      "N/A"
    end

    user_count = begin
      User.unscoped.count
    rescue StandardError
      "N/A"
    end

    logger.info(
      "K-12 LMS booting: RAILS_ENV=#{Rails.env}, tenant_count=#{tenant_count}, user_count=#{user_count}",
    )
  end
end
