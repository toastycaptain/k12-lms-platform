require "rails_helper"

RSpec.describe "Api::V1::Health", type: :request do
  before { Current.tenant = nil }
  after { Current.tenant = nil }

  describe "GET /api/v1/health" do
    it "returns ok when all critical checks pass" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_return(true)

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("ok")
      expect(body["database"]).to eq("connected")
      expect(body["redis"]).to eq("connected")
      expect(body["rails_env"]).to eq("test")
      expect(body).to have_key("version")
      expect(body).to have_key("sidekiq")
    end

    it "returns service unavailable when database check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_raise(StandardError, "db unavailable")

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body["database"]).to eq("error")
    end

    it "returns service unavailable when redis check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_raise(StandardError, "redis down")

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body["redis"]).to eq("error")
    end

    it "includes sidekiq queue information" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:redis_check!).and_return(true)

      get "/api/v1/health"

      body = JSON.parse(response.body)
      expect(body["sidekiq"]).to have_key("queues")
    end
  end
end
