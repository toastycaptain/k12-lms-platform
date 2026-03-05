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
      curriculum_core = response.parsed_body.find { |flag| flag["key"] == "curriculum_profiles_v2_core" }
      expect(curriculum_core).to be_present
      dependent_flag = response.parsed_body.find { |flag| flag["key"] == "planner_schema_renderer_v1" }
      expect(dependent_flag["requires"]).to include("curriculum_profiles_v2_core")
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

    it "blocks enabling dependent curriculum flags when the core flag is disabled" do
      mock_session(admin, tenant: tenant)

      put "/api/v1/admin/feature_flags/planner_schema_renderer_v1", params: { enabled: true }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("curriculum_profiles_v2_core")
    end

    it "supports rollout updates for multiple target tenants" do
      mock_session(admin, tenant: tenant)
      tenant2 = create(:tenant)

      FeatureFlag.find_or_create_by!(key: "curriculum_profiles_v2_core", tenant: tenant) { |flag| flag.enabled = true }
      FeatureFlag.find_or_create_by!(key: "curriculum_profiles_v2_core", tenant: tenant2) { |flag| flag.enabled = true }

      put "/api/v1/admin/feature_flags/planner_schema_renderer_v1", params: {
        enabled: true,
        target_tenant_ids: [ tenant.id, tenant2.id ]
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["executed"]).to eq(2)
      expect(FeatureFlag.enabled?("planner_schema_renderer_v1", tenant: tenant)).to eq(true)
      expect(FeatureFlag.enabled?("planner_schema_renderer_v1", tenant: tenant2)).to eq(true)
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
