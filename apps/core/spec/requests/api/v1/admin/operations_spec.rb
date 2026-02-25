require "rails_helper"

RSpec.describe "Api::V1::Admin::Operations", type: :request do
  let!(:tenant) { create(:tenant) }
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

  describe "GET /api/v1/admin/operations/health" do
    it "returns health data for admins" do
      mock_session(admin, tenant: tenant)
      allow(SystemHealthService).to receive(:check_all).and_return(
        timestamp: Time.current.iso8601,
        overall: "healthy",
        checks: {},
        metrics: {}
      )

      get "/api/v1/admin/operations/health"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("checks")
      expect(response.parsed_body).to have_key("metrics")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/operations/health"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
