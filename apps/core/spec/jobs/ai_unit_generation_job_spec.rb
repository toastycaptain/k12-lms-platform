require "rails_helper"

RSpec.describe AiUnitGenerationJob, type: :job do
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
      task_type: "unit_generation",
      enabled: true,
      temperature_limit: 0.5,
      max_tokens_limit: 2048
    )
  end
  let(:invocation) do
    create(:ai_invocation,
      tenant: tenant,
      user: user,
      ai_provider_config: provider_config,
      ai_task_policy: task_policy,
      task_type: "unit_generation",
      status: "pending"
    )
  end

  let(:gateway_client) { instance_double(AiGatewayClient) }
  let(:ai_response) do
    {
      "content" => '{"title":"Fractions Unit","lessons":[]}',
      "usage" => { "prompt_tokens" => 100, "completion_tokens" => 200, "total_tokens" => 300 }
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
    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })

    invocation.reload
    expect(invocation.status).to eq("completed")
    expect(invocation.prompt_tokens).to eq(100)
    expect(invocation.completion_tokens).to eq(200)
    expect(invocation.total_tokens).to eq(300)
  end

  it "starts the invocation before calling the gateway" do
    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })

    invocation.reload
    expect(invocation.started_at).to be_present
  end

  it "caches the result" do
    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })

    cached = memory_store.read("ai_result_#{invocation.id}")
    expect(cached["title"]).to eq("Fractions Unit")
  end

  it "uses temperature and token limits from task policy" do
    expect(gateway_client).to receive(:generate).with(
      hash_including(temperature: 0.5, max_tokens: 2048)
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })
  end

  it "fails the invocation on error and re-raises" do
    allow(gateway_client).to receive(:generate).and_raise(AiGatewayError.new("Gateway down"))

    expect {
      described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })
    }.to raise_error(AiGatewayError)

    invocation.reload
    expect(invocation.status).to eq("failed")
    expect(invocation.error_message).to eq("Gateway down")
  end

  it "handles non-JSON content gracefully" do
    allow(gateway_client).to receive(:generate).and_return(
      "content" => "This is plain text, not JSON",
      "usage" => { "prompt_tokens" => 10, "completion_tokens" => 5, "total_tokens" => 15 }
    )

    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })

    cached = memory_store.read("ai_result_#{invocation.id}")
    expect(cached["raw_content"]).to eq("This is plain text, not JSON")
  end

  it "uses template when available" do
    Current.tenant = tenant
    template = create(:ai_template,
      tenant: tenant,
      created_by: user,
      task_type: "unit_generation",
      status: "active",
      system_prompt: "You are a curriculum expert.",
      user_prompt_template: "Create a unit for {{subject}} about {{topic}} for grade {{grade_level}}."
    )
    invocation.update!(ai_template: template)

    expect(gateway_client).to receive(:generate).with(
      hash_including(
        prompt: "Create a unit for Math about Fractions for grade 5.",
        system_prompt: "You are a curriculum expert."
      )
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, { "subject" => "Math", "topic" => "Fractions", "grade_level" => "5" })
  end

  it "builds prompt with standards and additional context" do
    expect(gateway_client).to receive(:generate).with(
      hash_including(prompt: a_string_including("CCSS.Math.1"))
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, {
      "subject" => "Math",
      "topic" => "Fractions",
      "grade_level" => "5",
      "standards" => [ "CCSS.Math.1" ],
      "additional_context" => "Focus on visual models"
    })
  end
end
