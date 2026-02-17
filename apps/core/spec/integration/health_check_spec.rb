require "rails_helper"

RSpec.describe "Cross-service health checks", type: :request do
  describe "Rails API health endpoint" do
    it "reports live dependency status from /api/v1/health" do
      get "/api/v1/health"

      expect([ 200, 503 ]).to include(response.status)
      body = response.parsed_body
      expect(%w[healthy degraded]).to include(body["status"])
      expect(body["checks"]).to be_a(Hash)
      expect(%w[ok error skipped]).to include(body.dig("checks", "database", "status"))
      expect(%w[ok error skipped]).to include(body.dig("checks", "redis", "status"))
      expect(%w[ok error skipped]).to include(body.dig("checks", "sidekiq", "status"))
      expect(%w[ok error skipped]).to include(body.dig("checks", "ai_gateway", "status"))
      expect(%w[ok error]).to include(body.dig("checks", "migrations", "status"))

      critical_ok = body["checks"].values.all? { |check| %w[ok skipped].include?(check["status"]) }
      if critical_ok
        expect(response).to have_http_status(:ok)
        expect(body["status"]).to eq("healthy")
      else
        expect(response).to have_http_status(:service_unavailable)
        expect(body["status"]).to eq("degraded")
      end
    end
  end

  describe "AI gateway reachability" do
    it "checks AI gateway /v1/health when AI_GATEWAY_URL is configured" do
      gateway_url = ENV["AI_GATEWAY_URL"].to_s
      if gateway_url.blank?
        expect(gateway_url).to eq("")
        next
      end

      result = Faraday.new(url: gateway_url) do |conn|
        conn.options.open_timeout = 2
        conn.options.timeout = 2
      end.get("/v1/health")

      expect(result.status).to eq(200)
    end
  end

  describe "Redis connectivity" do
    it "checks Redis ping when REDIS_URL is configured" do
      redis_url = ENV["REDIS_URL"].to_s
      if redis_url.blank?
        expect(redis_url).to eq("")
        next
      end

      if defined?(Redis)
        redis = Redis.new(url: redis_url)
        expect(redis.ping).to eq("PONG")
      else
        redis_client = RedisClient.config(url: redis_url).new_client
        expect(redis_client.call("PING")).to eq("PONG")
      end
    end
  end
end
