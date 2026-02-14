require "rails_helper"

RSpec.describe "Api::V1::AiTaskPolicies", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_task_policies" do
    it "returns all task policies for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        task_type: "lesson_generation", allowed_roles: [ "admin", "teacher" ], enabled: true)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        task_type: "unit_generation", allowed_roles: [ "admin" ], enabled: false)
      Current.tenant = nil

      get "/api/v1/ai_task_policies"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns only allowed enabled policies for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        task_type: "lesson_generation", allowed_roles: [ "admin", "teacher" ], enabled: true)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        task_type: "unit_generation", allowed_roles: [ "admin" ], enabled: true)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        task_type: "differentiation", allowed_roles: [ "teacher" ], enabled: false)
      Current.tenant = nil

      get "/api/v1/ai_task_policies"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["task_type"]).to eq("lesson_generation")
    end
  end

  describe "POST /api/v1/ai_task_policies" do
    it "creates a task policy as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        post "/api/v1/ai_task_policies", params: {
          task_type: "lesson_generation",
          ai_provider_config_id: provider.id,
          allowed_roles: [ "admin", "teacher" ],
          max_tokens_limit: 2048,
          temperature_limit: 0.7
        }
      }.to change(AiTaskPolicy.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["task_type"]).to eq("lesson_generation")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/ai_task_policies", params: {
        task_type: "lesson_generation",
        ai_provider_config_id: provider.id,
        allowed_roles: [ "teacher" ]
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/ai_task_policies/:id" do
    it "updates a task policy" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil

      patch "/api/v1/ai_task_policies/#{policy.id}", params: {
        max_tokens_limit: 8192
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["max_tokens_limit"]).to eq(8192)
    end
  end

  describe "DELETE /api/v1/ai_task_policies/:id" do
    it "deletes a task policy" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil

      expect {
        delete "/api/v1/ai_task_policies/#{policy.id}"
      }.to change(AiTaskPolicy.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "GET /api/v1/ai_task_policies/:id" do
    it "shows a task policy for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil

      get "/api/v1/ai_task_policies/#{policy.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(policy.id)
    end

    it "shows a task policy for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider,
        allowed_roles: [ "teacher" ])
      Current.tenant = nil

      get "/api/v1/ai_task_policies/#{policy.id}"

      expect(response).to have_http_status(:ok)
    end
  end
end
