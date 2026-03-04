env_flag_enabled = lambda do |name, default|
  raw = ENV[name]
  next default if raw.nil?

  %w[1 true yes on].include?(raw.strip.downcase)
end

google_provider_ignores_state = env_flag_enabled.call("GOOGLE_PROVIDER_IGNORES_STATE", false)
if Rails.env.production? && google_provider_ignores_state
  raise "GOOGLE_PROVIDER_IGNORES_STATE must be disabled in production"
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV.fetch("GOOGLE_CLIENT_ID", "test-client-id"),
    ENV.fetch("GOOGLE_CLIENT_SECRET", "test-client-secret"),
    {
      scope: "email,profile",
      prompt: "consent",
      access_type: "offline",
      provider_ignores_state: google_provider_ignores_state && !Rails.env.production?,
      callback_path: "/auth/google_oauth2/callback"
    }
end

OmniAuth.config.allowed_request_methods = [ :post ]
OmniAuth.config.silence_get_warning = false
