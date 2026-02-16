require "rails_helper"

RSpec.describe "Api::V1::AiInvocations async create", type: :request do
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

  describe "POST /api/v1/ai_invocations with async=true" do
    it "returns 202 Accepted with invocation id" do
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

      allow(AiGenerationJob).to receive(:perform_later)

      post "/api/v1/ai_invocations", params: {
        task_type: "lesson_plan",
        prompt: "Create a lesson",
        async: true,
        context: { grade: "5" }
      }

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["invocation_id"]).to be_present
      expect(response.parsed_body["status"]).to eq("pending")
    end

    it "creates a pending invocation and enqueues AiGenerationJob" do
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

      allow(AiGenerationJob).to receive(:perform_later)

      expect {
        post "/api/v1/ai_invocations", params: {
          task_type: "lesson_plan",
          prompt: "Create a lesson",
          async: "true"
        }
      }.to change(AiInvocation.unscoped, :count).by(1)

      invocation = AiInvocation.unscoped.order(:id).last
      expect(invocation.status).to eq("pending")
      expect(invocation.context["messages"]).to be_present
      expect(AiGenerationJob).to have_received(:perform_later).with(invocation.id)
    end
  end
end
