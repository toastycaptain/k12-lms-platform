require "rails_helper"

RSpec.describe "Api::V1::AiTaskPolicies", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_task_policies" do
    it "lists policies for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil

      get "/api/v1/ai_task_policies"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "lists policies for teacher" do
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai_task_policies"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/ai_task_policies" do
    it "creates a policy as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/ai_task_policies", params: {
        ai_provider_config_id: provider.id,
        task_type: "assessment",
        enabled: true,
        allowed_roles: [ "teacher", "admin" ],
        max_tokens_limit: 2048
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["task_type"]).to eq("assessment")
    end
  end
end
