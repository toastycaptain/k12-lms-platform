require "rails_helper"

RSpec.describe AiLessonGenerationJob, type: :job do
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
      task_type: "lesson_generation",
      enabled: true
    )
  end
  let(:invocation) do
    create(:ai_invocation,
      tenant: tenant,
      user: user,
      ai_provider_config: provider_config,
      ai_task_policy: task_policy,
      task_type: "lesson_generation",
      status: "pending"
    )
  end

  let(:gateway_client) { instance_double(AiGatewayClient) }
  let(:ai_response) do
    {
      "content" => '{"title":"Photosynthesis Lesson","objectives":["Understand light reactions"]}',
      "usage" => { "prompt_tokens" => 80, "completion_tokens" => 150, "total_tokens" => 230 }
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
    described_class.perform_now(invocation.id, { "subject" => "Science", "topic" => "Photosynthesis", "grade_level" => "7" })

    invocation.reload
    expect(invocation.status).to eq("completed")
    expect(invocation.total_tokens).to eq(230)
  end

  it "caches the parsed result" do
    described_class.perform_now(invocation.id, { "subject" => "Science", "topic" => "Photosynthesis", "grade_level" => "7" })

    cached = memory_store.read("ai_result_#{invocation.id}")
    expect(cached["title"]).to eq("Photosynthesis Lesson")
  end

  it "includes unit plan context when unit_plan_id is provided" do
    Current.tenant = tenant
    course = create(:course, tenant: tenant)
    unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user, title: "Biology Unit")

    expect(gateway_client).to receive(:generate).with(
      hash_including(prompt: a_string_including("Biology Unit"))
    ).and_return(ai_response)

    described_class.perform_now(invocation.id, {
      "subject" => "Science",
      "topic" => "Photosynthesis",
      "grade_level" => "7",
      "unit_plan_id" => unit_plan.id.to_s
    })
  end

  it "fails the invocation on error" do
    allow(gateway_client).to receive(:generate).and_raise(AiGatewayError.new("Timeout"))

    expect {
      described_class.perform_now(invocation.id, { "subject" => "Science", "topic" => "Photosynthesis", "grade_level" => "7" })
    }.to raise_error(AiGatewayError)

    invocation.reload
    expect(invocation.status).to eq("failed")
    expect(invocation.error_message).to eq("Timeout")
  end
end
