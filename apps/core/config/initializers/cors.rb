Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch("CORS_ORIGINS", "http://localhost:3000")

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      credentials: true
  end

  allow do
    origins(/\Ahttps:\/\/.*\.google\.com\z/)
    resource "/api/v1/addon/*",
      headers: :any,
      methods: %i[get post options],
      credentials: true
  end
end
