require "rails_helper"

RSpec.describe "Api::V1::AiStream", type: :request do
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

  describe "POST /api/v1/ai/stream" do
    it "streams SSE data and creates an invocation" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "teacher" ]
      )
      Current.tenant = nil

      allow(AiGatewayClient).to receive(:generate_stream) do |**_args, &block|
        block.call("Hello ", { "content" => "Hello " })
        block.call("world", { "content" => "world" })
        "Hello world"
      end

      expect {
        post "/api/v1/ai/stream", params: { task_type: "lesson_plan", prompt: "Draft a lesson" }
      }.to change(AiInvocation.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include("text/event-stream")
      expect(response.body).to include("token")
      expect(response.body).to include("done")
      expect(AiInvocation.unscoped.order(:id).last.status).to eq("completed")
    end

    it "returns forbidden when task type is disabled" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: false,
        allowed_roles: [ "teacher" ]
      )
      Current.tenant = nil

      post "/api/v1/ai/stream", params: { task_type: "lesson_plan", prompt: "test" }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("AI task type not enabled")
    end

    it "returns forbidden when user role is not authorized" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "admin" ]
      )
      Current.tenant = nil

      post "/api/v1/ai/stream", params: { task_type: "lesson_plan", prompt: "test" }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to include("not authorized")
    end

    it "returns forbidden when policy requires approval" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: true,
        requires_approval: true,
        allowed_roles: [ "teacher" ]
      )
      Current.tenant = nil

      post "/api/v1/ai/stream", params: { task_type: "lesson_plan", prompt: "needs approval" }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("This AI action requires approval")
    end

    it "returns service unavailable when no active provider config exists" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin, status: "inactive")
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "teacher" ]
      )
      Current.tenant = nil

      post "/api/v1/ai/stream", params: { task_type: "lesson_plan", prompt: "test" }

      expect(response).to have_http_status(:service_unavailable)
      expect(response.parsed_body["error"]).to eq("No AI provider configured")
    end

    it "uses policy model override instead of requested model" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      inactive_provider = create(
        :ai_provider_config,
        tenant: tenant,
        created_by: admin,
        status: "inactive",
        default_model: "claude-sonnet-4-5-20250929"
      )
      active_provider = create(
        :ai_provider_config,
        tenant: tenant,
        created_by: admin,
        provider_name: "openai",
        default_model: "gpt-4o-mini",
        status: "active"
      )
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: inactive_provider,
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "teacher" ],
        model_override: "gpt-4.1-mini"
      )
      Current.tenant = nil

      allow(AiGatewayClient).to receive(:generate_stream).and_return("model override response")

      post "/api/v1/ai/stream", params: {
        task_type: "lesson_plan",
        prompt: "Use override",
        model: "should-not-be-used"
      }

      expect(response).to have_http_status(:ok)
      expect(AiGatewayClient).to have_received(:generate_stream).with(
        hash_including(
          provider: active_provider.provider_name,
          model: "gpt-4.1-mini"
        )
      )
    end
  end
end
