Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
    ENV.fetch("GOOGLE_CLIENT_ID", "test-client-id"),
    ENV.fetch("GOOGLE_CLIENT_SECRET", "test-client-secret"),
    {
      scope: "email,profile",
      prompt: "consent",
      access_type: "offline",
      callback_path: "/auth/google_oauth2/callback"
    }
end

OmniAuth.config.allowed_request_methods = [ :post, :get ]
OmniAuth.config.silence_get_warning = true
