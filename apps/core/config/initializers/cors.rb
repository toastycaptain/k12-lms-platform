allowed_origins = ENV.fetch("CORS_ORIGINS", "http://localhost:3000")
  .split(",")
  .map(&:strip)
  .reject(&:blank?)

if Rails.env.production?
  raise "CORS_ORIGINS must include at least one explicit origin in production" if allowed_origins.empty?
  if allowed_origins.any? { |origin| origin == "*" }
    raise "CORS_ORIGINS cannot include '*' when credentials are enabled"
  end
end

addon_allowed_origins = ENV.fetch("ADDON_CORS_ORIGINS", "")
  .split(",")
  .map(&:strip)
  .reject(&:blank?)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/v1/*",
      headers: %w[Accept Authorization Content-Type X-CSRF-Token X-Requested-With X-Tenant-Slug],
      methods: %i[get post put patch delete options head],
      credentials: true,
      max_age: 600
  end

  allow do
    if addon_allowed_origins.present?
      origins(*addon_allowed_origins)
    else
      origins(/\Ahttps:\/\/([a-z0-9-]+\.)*google\.com\z/)
    end

    resource "/api/v1/addon/*",
      headers: %w[Accept Authorization Content-Type X-Requested-With],
      methods: %i[get post options],
      credentials: true,
      max_age: 600
  end
end
