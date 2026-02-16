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
      expect(response.parsed_body["error"]).to include("not enabled")
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
  end
end
