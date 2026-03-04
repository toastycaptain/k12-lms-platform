cookie_domain = ENV["SESSION_COOKIE_DOMAIN"].presence
cookie_key = if Rails.env.production?
  cookie_domain.present? ? "__Secure-k12_lms_session" : "__Host-k12_lms_session"
else
  "_k12_lms_session"
end

Rails.application.config.session_store :cookie_store,
  key: cookie_key,
  secure: Rails.env.production?,
  httponly: true,
  domain: cookie_domain,
  path: "/",
  same_site: Rails.env.production? ? :none : :lax,
  expire_after: 12.hours
