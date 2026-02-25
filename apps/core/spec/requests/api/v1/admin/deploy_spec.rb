require "rails_helper"

RSpec.describe "Api::V1::Admin::Deploy", type: :request do
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

  describe "GET /api/v1/admin/deploy/window" do
    it "returns deploy window status for admins" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/deploy/window"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to have_key("allowed")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/deploy/window"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
