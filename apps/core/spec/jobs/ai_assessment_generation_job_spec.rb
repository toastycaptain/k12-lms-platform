require "rails_helper"

RSpec.describe AiAssessmentGenerationJob, type: :job do
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
      task_type: "assessment_generation",
      enabled: true
    )
  end
  let(:invocation) do
    create(:ai_invocation,
      tenant: tenant,
      user: user,
      ai_provider_config: provider_config,
      ai_task_policy: task_policy,
      task_type: "assessment_generation",
      status: "pending"
    )
  end

  let(:gateway_client) { instance_double(AiGatewayClient) }
  let(:ai_response) do
    {
      "content" => '{"questions":[{"type":"multiple_choice","text":"What caused WWII?"}]}',
      "usage" => { "prompt_tokens" => 60, "completion_tokens" => 120, "total_tokens" => 180 }
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
      "topic" => "World War II",
      "grade_level" => "10",
      "num_questions" => "10",
      "question_types" => [ "multiple_choice" ]
    })

    invocation.reload
    expect(invocation.status).to eq("completed")
    expect(invocation.total_tokens).to eq(180)
  end

  it "caches the result" do
    described_class.perform_now(invocation.id, {
      "topic" => "World War II",
      "grade_level" => "10",
      "num_questions" => "10"
    })

    cached = memory_store.read("ai_result_#{invocation.id}")
    expect(cached["questions"]).to be_an(Array)
  end

  it "builds prompt with question types and difficulty" do
    expect(gateway_client).to receive(:generate).with(
      hash_including(
        prompt: a_string_including("World War II").and(a_string_including("multiple_choice")),
        task_type: "assessment_generation"
      )
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, {
      "topic" => "World War II",
      "grade_level" => "10",
      "num_questions" => "10",
      "question_types" => [ "multiple_choice" ],
      "difficulty" => "medium"
    })
  end

  it "fails the invocation on error" do
    allow(gateway_client).to receive(:generate).and_raise(AiGatewayError.new("API error"))

    expect {
      described_class.perform_now(invocation.id, {
        "topic" => "World War II",
        "grade_level" => "10"
      })
    }.to raise_error(AiGatewayError)

    invocation.reload
    expect(invocation.status).to eq("failed")
  end
end
