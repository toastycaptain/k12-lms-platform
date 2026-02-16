require "rails_helper"

RSpec.describe "AI Gateway integration", type: :request do
  let(:tenant) { create(:tenant) }

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

  let(:provider) do
    create(
      :ai_provider_config,
      tenant: tenant,
      created_by: admin,
      provider_name: "openai",
      default_model: "gpt-4o-mini",
      status: "active"
    )
  end

  let(:task_policy) do
    create(
      :ai_task_policy,
      tenant: tenant,
      created_by: admin,
      ai_provider_config: provider,
      task_type: "lesson_plan",
      enabled: true,
      allowed_roles: [ "teacher" ]
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  def create_pending_invocation
    create(
      :ai_invocation,
      tenant: tenant,
      user: teacher,
      ai_provider_config: provider,
      ai_task_policy: task_policy,
      task_type: "lesson_plan",
      provider_name: provider.provider_name,
      model: provider.default_model,
      status: "pending",
      started_at: nil,
      completed_at: nil,
      context: {
        "messages" => [ { "role" => "user", "content" => "Create a lesson plan." } ],
        "max_tokens" => 1024,
        "temperature" => 0.2
      }
    )
  end

  describe "AiGenerationJob lifecycle" do
    it "transitions pending invocation to completed and persists usage metadata" do
      invocation = create_pending_invocation
      expect(invocation.status).to eq("pending")

      allow(AiGatewayClient).to receive(:generate).and_return(
        "id" => "gen-123",
        "content" => "Generated lesson plan...",
        "model" => provider.default_model,
        "provider" => provider.provider_name,
        "usage" => {
          "prompt_tokens" => 100,
          "completion_tokens" => 200,
          "total_tokens" => 300
        },
      )

      expect { AiGenerationJob.perform_now(invocation.id) }.not_to raise_error

      expect(AiGatewayClient).to have_received(:generate).with(
        hash_including(
          provider: provider.provider_name,
          model: provider.default_model,
          messages: invocation.context["messages"],
          task_type: "lesson_plan",
          max_tokens: 1024,
          temperature: 0.2,
        )
      )

      invocation.reload
      expect(invocation.status).to eq("completed")
      expect(invocation.started_at).to be_present
      expect(invocation.completed_at).to be_present
      expect(invocation.prompt_tokens).to eq(100)
      expect(invocation.completion_tokens).to eq(200)
      expect(invocation.total_tokens).to eq(300)
      expect(invocation.duration_ms).to be_present
      expect(invocation.context["response"]).to include("content" => "Generated lesson plan...")
    end

    it "marks invocation as failed when gateway generation raises an error" do
      invocation = create_pending_invocation

      allow(AiGatewayClient).to receive(:generate).and_raise(
        AiGatewayClient::AiGatewayError.new("Gateway unavailable", status_code: 502)
      )

      expect { AiGenerationJob.perform_now(invocation.id) }.not_to raise_error

      invocation.reload
      expect(invocation.status).to eq("failed")
      expect(invocation.error_message).to include("Gateway unavailable")
      expect(invocation.completed_at).to be_present
    end
  end

  describe "streaming lifecycle" do
    it "persists accumulated stream usage tokens and completion state" do
      mock_session(teacher, tenant: tenant)
      task_policy

      allow(AiGatewayClient).to receive(:generate_stream) do |**_args, &block|
        block.call("Generated ", { "content" => "Generated " })
        block.call(
          "lesson plan",
          {
            "content" => "lesson plan",
            "usage" => {
              "prompt_tokens" => 11,
              "completion_tokens" => 22,
              "total_tokens" => 33
            }
          }
        )
        "Generated lesson plan"
      end

      expect {
        post "/api/v1/ai/stream", params: {
          task_type: "lesson_plan",
          prompt: "Create a lesson plan for ecosystems"
        }
      }.to change(AiInvocation.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)

      invocation = AiInvocation.unscoped.order(:id).last
      expect(invocation.status).to eq("completed")
      expect(invocation.prompt_tokens).to eq(11)
      expect(invocation.completion_tokens).to eq(22)
      expect(invocation.total_tokens).to eq(33)
      expect(invocation.context["response"]).to include("content" => "Generated lesson plan")
    end
  end
end
