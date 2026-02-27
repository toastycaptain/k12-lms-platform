Rails.application.config.session_store :cookie_store,
  key: "_k12_lms_session",
  secure: Rails.env.production?,
  httponly: true,
  domain: ENV["SESSION_COOKIE_DOMAIN"].presence,
  same_site: Rails.env.production? ? :none : :lax,
  expire_after: 12.hours
