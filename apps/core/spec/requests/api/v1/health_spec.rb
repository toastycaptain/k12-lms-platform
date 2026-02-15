require "rails_helper"

RSpec.describe "Api::V1::Health", type: :request do
  before { Current.tenant = nil }
  after { Current.tenant = nil }

  describe "GET /api/v1/health" do
    it "returns ok when all dependency checks pass" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:cache_check!).and_return(true)
      allow_any_instance_of(Api::V1::HealthController).to receive(:queue_check!).and_return(true)

      get "/api/v1/health"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("ok")
      expect(body["checks"]).to eq(
        "database" => "ok",
        "cache" => "ok",
        "queue" => "ok"
      )
    end

    it "returns service unavailable when any dependency check fails" do
      allow_any_instance_of(Api::V1::HealthController).to receive(:database_check!).and_raise(StandardError, "db unavailable")

      get "/api/v1/health"

      expect(response).to have_http_status(:service_unavailable)
      body = JSON.parse(response.body)
      expect(body["status"]).to eq("degraded")
      expect(body["checks"]["database"]).to match(/^error:/)
    end
  end
end
