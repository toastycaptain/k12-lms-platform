require "rails_helper"

RSpec.describe AiGenerationJob, type: :job do
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

  let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin) }
  let(:policy_record) do
    create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider, task_type: "lesson_plan")
  end
  let(:invocation) do
    create(
      :ai_invocation,
      tenant: tenant,
      user: teacher,
      ai_provider_config: provider,
      ai_task_policy: policy_record,
      task_type: "lesson_plan",
      model: provider.default_model,
      status: "pending",
      started_at: nil,
      completed_at: nil,
      context: {
        "messages" => [ { "role" => "user", "content" => "Generate a lesson" } ],
        "max_tokens" => 512,
        "temperature" => 0.4,
        "return_url" => "/plan/units/1"
      }
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "calls the AI gateway and marks invocation completed" do
    result = {
      "content" => "Generated lesson",
      "usage" => {
        "prompt_tokens" => 10,
        "completion_tokens" => 40,
        "total_tokens" => 50
      }
    }

    allow(AiGatewayClient).to receive(:generate).and_return(result)

    described_class.perform_now(invocation.id)

    invocation.reload
    expect(AiGatewayClient).to have_received(:generate).with(
      provider: provider.provider_name,
      model: invocation.model,
      messages: invocation.context["messages"],
      task_type: "lesson_plan",
      max_tokens: 512,
      temperature: 0.4
    )
    expect(invocation.status).to eq("completed")
    expect(invocation.total_tokens).to eq(50)
    expect(invocation.context.dig("response", "content")).to eq("Generated lesson")
  end

  it "marks invocation failed when gateway raises AiGatewayError" do
    allow(AiGatewayClient).to receive(:generate).and_raise(
      AiGatewayClient::AiGatewayError.new("Gateway unavailable", status_code: 502)
    )

    expect {
      described_class.perform_now(invocation.id)
    }.not_to raise_error

    invocation.reload
    expect(invocation.status).to eq("failed")
    expect(invocation.error_message).to include("Gateway unavailable")
  end

  it "marks invocation failed and re-raises when gateway raises StandardError" do
    allow(AiGatewayClient).to receive(:generate).and_raise(
      StandardError.new("something unexpected")
    )

    expect {
      described_class.perform_now(invocation.id)
    }.to raise_error(StandardError, "something unexpected")

    invocation.reload
    expect(invocation.status).to eq("failed")
    expect(invocation.error_message).to include("something unexpected")
  end

  it "creates a notification on completion" do
    allow(AiGatewayClient).to receive(:generate).and_return(
      "content" => "Generated lesson",
      "usage" => { "prompt_tokens" => 5, "completion_tokens" => 5, "total_tokens" => 10 }
    )

    expect {
      described_class.perform_now(invocation.id)
    }.to change(Notification, :count).by(1)

    notification = Notification.order(:id).last
    expect(notification.notification_type).to eq("ai_generation_complete")
    expect(notification.user_id).to eq(teacher.id)
    expect(notification.notifiable).to eq(invocation)
  end
end
