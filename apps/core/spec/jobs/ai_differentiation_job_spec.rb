require "rails_helper"

RSpec.describe AiDifferentiationJob, type: :job do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    u
  end
  let(:provider_config) do
    create(:ai_provider_config, tenant: tenant, created_by: user, status: "active")
  end
  let(:task_policy) do
    create(:ai_task_policy,
      tenant: tenant,
      ai_provider_config: provider_config,
      created_by: user,
      task_type: "differentiation",
      enabled: true
    )
  end
  let(:invocation) do
    create(:ai_invocation,
      tenant: tenant,
      user: user,
      ai_provider_config: provider_config,
      ai_task_policy: task_policy,
      task_type: "differentiation",
      status: "pending"
    )
  end

  let(:gateway_client) { instance_double(AiGatewayClient) }
  let(:ai_response) do
    {
      "content" => '{"differentiated_content":"Simplified version of the lesson"}',
      "usage" => { "prompt_tokens" => 50, "completion_tokens" => 100, "total_tokens" => 150 }
    }
  end

  let(:memory_store) { ActiveSupport::Cache::MemoryStore.new }

  before do
    allow(AiGatewayClient).to receive(:new).and_return(gateway_client)
    allow(gateway_client).to receive(:generate).and_return(ai_response)
    allow(Rails).to receive(:cache).and_return(memory_store)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "calls the AI gateway and completes the invocation" do
    described_class.perform_now(invocation.id, {
      "content" => "Complex lesson content",
      "differentiation_type" => "simplified",
      "grade_level" => "3"
    })

    invocation.reload
    expect(invocation.status).to eq("completed")
    expect(invocation.total_tokens).to eq(150)
  end

  it "caches the result" do
    described_class.perform_now(invocation.id, {
      "content" => "Complex lesson content",
      "differentiation_type" => "simplified",
      "grade_level" => "3"
    })

    cached = memory_store.read("ai_result_#{invocation.id}")
    expect(cached["differentiated_content"]).to eq("Simplified version of the lesson")
  end

  it "builds prompt with differentiation type and content" do
    expect(gateway_client).to receive(:generate).with(
      hash_including(
        prompt: a_string_including("simplified").and(a_string_including("Complex lesson content")),
        task_type: "differentiation"
      )
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, {
      "content" => "Complex lesson content",
      "differentiation_type" => "simplified",
      "grade_level" => "3"
    })
  end

  it "fails the invocation on error" do
    allow(gateway_client).to receive(:generate).and_raise(AiGatewayError.new("Service error"))

    expect {
      described_class.perform_now(invocation.id, {
        "content" => "Content",
        "differentiation_type" => "advanced",
        "grade_level" => "5"
      })
    }.to raise_error(AiGatewayError)

    invocation.reload
    expect(invocation.status).to eq("failed")
  end
end
