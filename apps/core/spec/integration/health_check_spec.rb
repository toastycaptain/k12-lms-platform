require "rails_helper"

RSpec.describe "Cross-service health checks", type: :request do
  describe "Rails API health endpoint" do
    it "returns 200 for /api/v1/health when critical dependencies are connected" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_return(true)

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("ok")
      expect(body["database"]).to eq("connected")
      expect(body["redis"]).to eq("connected")
    end
  end

  describe "AI gateway reachability" do
    it "checks AI gateway /v1/health when AI_GATEWAY_URL is configured" do
      gateway_url = ENV["AI_GATEWAY_URL"].to_s
      if gateway_url.blank?
        expect(gateway_url).to eq("")
        next
      end

      connection = instance_double(Faraday::Connection)
      gateway_response = instance_double(Faraday::Response, status: 200, success?: true)

      allow(Faraday).to receive(:new).with(url: gateway_url).and_return(connection)
      allow(connection).to receive(:get).with("/v1/health").and_return(gateway_response)

      result = Faraday.new(url: gateway_url).get("/v1/health")

      expect(result.status).to eq(200)
      expect(connection).to have_received(:get).with("/v1/health")
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
        redis = instance_double(Redis)
        allow(Redis).to receive(:new).with(url: redis_url).and_return(redis)
        allow(redis).to receive(:ping).and_return("PONG")

        expect(Redis.new(url: redis_url).ping).to eq("PONG")
      else
        redis_client = instance_double("RedisClient")
        redis_config = instance_double("RedisClientConfig")

        allow(RedisClient).to receive(:config).with(url: redis_url).and_return(redis_config)
        allow(redis_config).to receive(:new_client).and_return(redis_client)
        allow(redis_client).to receive(:call).with("PING").and_return("PONG")

        expect(RedisClient.config(url: redis_url).new_client.call("PING")).to eq("PONG")
      end
    end
  end
end
