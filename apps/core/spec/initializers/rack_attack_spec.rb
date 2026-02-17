require "rails_helper"

RSpec.describe "Rack::Attack Rate Limiting", type: :request do
  describe "configuration" do
    it "has auth rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("auth/ip")
    end

    it "has per-user rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("authenticated/user")
    end

    it "has upload rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("uploads/user")
    end

    it "has search rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("search/user")
    end

    it "has export rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("exports/user")
    end

    it "has message rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("messages/user")
    end

    it "has AI rate limiting" do
      throttles = Rack::Attack.throttles.keys
      expect(throttles).to include("ai/user")
    end
  end

  describe "throttled response" do
    it "returns JSON with rate limit headers" do
      responder = Rack::Attack.throttled_responder
      expect(responder).to be_a(Proc)

      mock_request = double(
        env: {
          "rack.attack.match_data" => {
            epoch_time: Time.now.to_i,
            period: 60,
            limit: 120,
            count: 121
          }
        }
      )

      status, headers, body = responder.call(mock_request)
      expect(status).to eq(429)
      expect(headers).to have_key("Retry-After")
      expect(headers).to have_key("X-RateLimit-Limit")
      expect(headers["X-RateLimit-Limit"]).to eq("120")

      parsed_body = JSON.parse(body.first)
      expect(parsed_body["error"]).to eq("rate_limited")
      expect(parsed_body["retry_after"]).to be_a(Integer)
    end
  end
end
