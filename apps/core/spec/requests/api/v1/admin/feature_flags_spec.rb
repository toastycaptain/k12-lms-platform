require "rails_helper"

RSpec.describe "Api::V1::Admin::FeatureFlags", type: :request do
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

  describe "GET /api/v1/admin/feature_flags" do
    it "returns feature flags for admins" do
      mock_session(admin, tenant: tenant)

      get "/api/v1/admin/feature_flags"

      expect(response).to have_http_status(:ok)
      keys = response.parsed_body.map { |flag| flag["key"] }
      expect(keys).to include("portfolio_enabled")
    end

    it "returns forbidden for non-admin users" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/admin/feature_flags"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PUT /api/v1/admin/feature_flags/:key" do
    it "updates a tenant override" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/feature_flags/portfolio_enabled", params: { enabled: false }

      expect(response).to have_http_status(:ok)
      expect(FeatureFlag.enabled?("portfolio_enabled", tenant: tenant)).to be(false)
    end
  end

  describe "DELETE /api/v1/admin/feature_flags/:key" do
    it "removes tenant override" do
      mock_session(admin, tenant: tenant)
      FeatureFlag.create!(key: "new_gradebook", tenant: tenant, enabled: true)

      delete "/api/v1/admin/feature_flags/new_gradebook"

      expect(response).to have_http_status(:ok)
      expect(FeatureFlag.find_by(key: "new_gradebook", tenant: tenant)).to be_nil
    end
  end
end
