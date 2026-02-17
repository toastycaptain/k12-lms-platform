module RateLimitHeaders
  extend ActiveSupport::Concern

  included do
    after_action :set_rate_limit_headers
  end

  private

  def set_rate_limit_headers
    return unless request.path.start_with?("/api/")

    response.headers["X-RateLimit-Limit"] = "120"
    response.headers["X-RateLimit-Policy"] = "120;w=60"
  end
end
