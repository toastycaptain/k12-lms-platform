Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src :self, "https://fonts.gstatic.com"
    policy.img_src :self, :data, "https:", "blob:"
    policy.object_src :none
    policy.script_src :self
    policy.style_src :self, :unsafe_inline, "https://fonts.googleapis.com"

    connect_sources = [ :self ]
    gateway_url = ENV["AI_GATEWAY_URL"].presence
    connect_sources << gateway_url if gateway_url
    policy.connect_src(*connect_sources)

    policy.frame_src :self, "https://docs.google.com", "https://drive.google.com"
  end

  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
  config.content_security_policy_nonce_directives = %w[script-src]
end
