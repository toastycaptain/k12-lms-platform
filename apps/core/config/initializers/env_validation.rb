# Environment variable validation — runs on boot
#
# Required vars cause a logged warning in production (does not crash).
# Recommended vars cause a logged info message if missing.
# A startup summary is always logged.

Rails.application.config.after_initialize do
  next if Rails.env.test? && !ENV["VALIDATE_ENV_IN_TEST"]

  logger = Rails.logger || Logger.new($stdout)

  required_vars = %w[DATABASE_URL REDIS_URL SECRET_KEY_BASE]

  if Rails.env.production?
    missing_required = required_vars.select { |var| ENV[var].blank? }
    if missing_required.any?
      logger.warn(
        "PRODUCTION WARNING: Missing required environment variables: #{missing_required.join(', ')}. " \
        "The application may not function correctly.",
      )
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
