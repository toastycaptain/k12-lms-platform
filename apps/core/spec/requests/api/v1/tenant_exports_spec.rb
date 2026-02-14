require "rails_helper"

RSpec.describe "Api::V1::TenantExports", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "POST /api/v1/tenant/export" do
    it "enqueues export job for admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/tenant/export"
      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["message"]).to eq("Export job enqueued")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/tenant/export"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/tenant/export_status" do
    it "returns pending when no export exists" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/tenant/export_status"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("pending")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/tenant/export_status"
      expect(response).to have_http_status(:forbidden)
    end
  end
end
