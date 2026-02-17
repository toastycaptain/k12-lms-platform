require "rails_helper"

RSpec.describe "Api::V1::Health", type: :request do
  before { Current.tenant = nil }
  after { Current.tenant = nil }

  describe "GET /api/v1/health" do
    it "returns ok when all critical checks pass" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_database).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_redis).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_sidekiq).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_ai_gateway).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_migrations).and_return({ status: "ok" })

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("healthy")
      expect(body.dig("checks", "database", "status")).to eq("ok")
      expect(body.dig("checks", "redis", "status")).to eq("ok")
      expect(body.dig("checks", "sidekiq", "status")).to eq("ok")
      expect(body.dig("checks", "ai_gateway", "status")).to eq("ok")
      expect(body.dig("checks", "migrations", "status")).to eq("ok")
      expect(body["rails_env"]).to eq("test")
      expect(body).to have_key("version")
      expect(body).to have_key("checks")
    end

    it "returns service unavailable when database check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_database).and_return({ status: "error", message: "db unavailable" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_redis).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_sidekiq).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_ai_gateway).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_migrations).and_return({ status: "ok" })

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body.dig("checks", "database", "status")).to eq("error")
    end

    it "returns service unavailable when redis check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_database).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_redis).and_return({ status: "error", message: "redis down" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_sidekiq).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_ai_gateway).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_migrations).and_return({ status: "ok" })

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body.dig("checks", "redis", "status")).to eq("error")
    end

    it "supports skipped optional checks without degrading status" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_database).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_redis).and_return({ status: "ok" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_sidekiq).and_return({ status: "skipped", message: "Sidekiq not loaded" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_ai_gateway).and_return({ status: "skipped", message: "not configured" })
      allow_any_instance_of(Api::V1::HealthController).to receive(:check_migrations).and_return({ status: "ok" })

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("healthy")
      expect(body.dig("checks", "sidekiq", "status")).to eq("skipped")
      expect(body.dig("checks", "ai_gateway", "status")).to eq("skipped")
    end
  end
end
