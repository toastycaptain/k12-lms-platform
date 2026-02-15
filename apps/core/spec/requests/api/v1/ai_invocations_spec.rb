require "rails_helper"

RSpec.describe "Api::V1::AiInvocations", type: :request do
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

  describe "GET /api/v1/ai_invocations" do
    it "lists own invocations for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy_record = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: policy_record)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider, ai_task_policy: policy_record)
      Current.tenant = nil

      get "/api/v1/ai_invocations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "lists all invocations for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy_record = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: policy_record)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider, ai_task_policy: policy_record)
      Current.tenant = nil

      get "/api/v1/ai_invocations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end

  describe "POST /api/v1/ai_invocations" do
    it "creates an invocation and calls AI Gateway" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin, provider_name: "anthropic", default_model: "claude-sonnet-4-5-20250929")
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider, task_type: "lesson_plan", enabled: true, allowed_roles: [ "teacher" ])
      Current.tenant = nil

      fake_response = {
        "content" => "Here is your lesson plan...",
        "provider" => "anthropic",
        "model" => "claude-sonnet-4-5-20250929",
        "usage" => { "prompt_tokens" => 100, "completion_tokens" => 200, "total_tokens" => 300 }
      }
      allow(AiGatewayClient).to receive(:generate).and_return(fake_response)

      expect {
        post "/api/v1/ai_invocations", params: {
          task_type: "lesson_plan",
          prompt: "Create a math lesson for 5th grade",
          context: { grade: "5", subject: "math" }
        }
      }.to change(AiInvocation.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["content"]).to include("lesson plan")
      expect(AiInvocation.unscoped.order(:id).last.status).to eq("completed")
    end

    it "returns forbidden when task type is disabled" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider, task_type: "lesson_plan", enabled: false)
      Current.tenant = nil

      post "/api/v1/ai_invocations", params: { task_type: "lesson_plan", prompt: "test" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
