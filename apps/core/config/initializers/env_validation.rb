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
    required_vars += %w[CORS_ORIGINS FRONTEND_URL ALLOWED_HOSTS]
    missing_required = required_vars.select { |var| ENV[var].blank? }
    if missing_required.any?
      raise "Missing required environment variables in production: #{missing_required.join(', ')}"
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
