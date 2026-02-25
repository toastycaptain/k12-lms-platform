require "rails_helper"

RSpec.describe "Api::V1::Admin::Safety", type: :request do
  let!(:tenant) { create(:tenant, settings: { "ai_safety_level" => "strict" }) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/admin/safety/stats" do
    it "returns stats for admin users" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/safety/stats"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("total_invocations")
      expect(response.parsed_body).to have_key("blocked_count")
      expect(response.parsed_body).to have_key("block_rate")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/safety/stats"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/admin/safety/config" do
    it "returns current safety level" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/safety/config"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["safety_level"]).to eq("strict")
    end
  end

  describe "PUT /api/v1/admin/safety/config" do
    it "updates safety level" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/safety/config", params: { safety_level: "moderate" }

      expect(response).to have_http_status(:ok)
      expect(tenant.reload.settings["ai_safety_level"]).to eq("moderate")
    end

    it "rejects invalid safety level" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/safety/config", params: { safety_level: "invalid" }

      expect(response).to have_http_status(:bad_request)
    end
  end
end
