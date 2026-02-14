# Row-Level Security configuration
# RLS is disabled by default in development and test environments.
# Set ENABLE_RLS=true to enable PostgreSQL row-level security policies.

Rails.application.config.after_initialize do
  if ENV.fetch("ENABLE_RLS", "false") == "true"
    Rails.logger.info "Row-Level Security (RLS) is ENABLED"
  else
    Rails.logger.info "Row-Level Security (RLS) is DISABLED"
  end
end
