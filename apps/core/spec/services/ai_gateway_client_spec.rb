require "rails_helper"

RSpec.describe AiGatewayClient do
  let(:tenant) { create(:tenant) }
  let(:conn) { instance_double(Faraday::Connection) }
  let(:messages) { [ { "role" => "user", "content" => "Hello" } ] }

  before do
    Current.tenant = tenant
    stub_const("AiGatewayClient::BASE_URL", "http://localhost:8000")
    stub_const("AiGatewayClient::SERVICE_TOKEN", "service-token")
    allow(Faraday).to receive(:new).and_return(conn)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe ".generate" do
    it "returns the parsed response body on success" do
      request = build_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: { "content" => "Hello!" })
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_return(response)

      result = described_class.generate(provider: "openai", model: "gpt-4o-mini", messages: messages)

      expect(result).to eq({ "content" => "Hello!" })
    end

    it "sends the expected payload to /v1/generate" do
      request = build_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: { "content" => "ok" })
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_return(response)

      described_class.generate(
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          { "role" => "system", "content" => "You are a tutor." },
          { "role" => "user", "content" => "Write a lesson objective." }
        ],
        task_type: "lesson_plan",
        max_tokens: 1024,
        temperature: 0.2,
        context: { "grade_level" => "5" }
      )

      expect(request.body).to eq(
        provider: "openai",
        model: "gpt-4o-mini",
        prompt: "Write a lesson objective.",
        system_prompt: "You are a tutor.",
        task_type: "lesson_plan",
        max_tokens: 1024,
        temperature: 0.2,
        context: { "grade_level" => "5" }
      )
    end

    it "sends the authorization header with the service bearer token" do
      request = build_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: { "content" => "ok" })
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_return(response)

      described_class.generate(provider: "openai", model: "gpt-4o-mini", messages: messages)

      expect(request.headers["Authorization"]).to eq("Bearer service-token")
    end

    it "omits nil fields from the payload" do
      request = build_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: { "content" => "ok" })
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_return(response)

      described_class.generate(
        provider: "anthropic",
        model: "claude-3-7-sonnet",
        messages: messages,
        task_type: nil
      )

      expect(request.body).to eq(
        provider: "anthropic",
        model: "claude-3-7-sonnet",
        prompt: "Hello",
        max_tokens: 4096,
        temperature: 0.7
      )
      expect(request.body).not_to have_key(:task_type)
    end

    it "raises AiGatewayError when no user prompt can be derived" do
      expect {
        described_class.generate(
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [ { role: "system", content: "System only" } ]
        )
      }.to raise_error(described_class::AiGatewayError, /AI prompt is required/)
    end

    it "raises AiGatewayError with status and body on non-success responses" do
      request = build_request
      error_response = instance_double(
        Faraday::Response,
        success?: false,
        status: 500,
        body: { "error" => "Internal error" }
      )
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_return(error_response)

      expect {
        described_class.generate(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(described_class::AiGatewayError, /500/) { |error|
        expect(error.status_code).to eq(500)
        expect(error.response_body).to eq({ "error" => "Internal error" })
      }
    end

    it "raises Faraday::TimeoutError when the request times out" do
      request = build_request
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_raise(Faraday::TimeoutError.new("execution expired"))

      expect {
        described_class.generate(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(Faraday::TimeoutError, /execution expired/)
    end

    it "raises Faraday::ConnectionFailed when the connection fails" do
      request = build_request
      allow(conn).to receive(:post).with("/v1/generate").and_yield(request).and_raise(Faraday::ConnectionFailed.new("Connection refused"))

      expect {
        described_class.generate(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(Faraday::ConnectionFailed, /Connection refused/)
    end
  end

  describe "invocation lifecycle" do
    let(:admin) do
      user = create(:user, tenant: tenant)
      user.add_role(:admin)
      user
    end
    let(:teacher) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin, status: "active") }
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
        context: { "messages" => [ { "role" => "user", "content" => "Generate a lesson." } ] }
      )
    end

    it "transitions pending -> running -> completed and records usage tokens" do
      allow(AiGatewayClient).to receive(:generate).and_return(
        "content" => "Generated lesson",
        "usage" => { "prompt_tokens" => 12, "completion_tokens" => 40, "total_tokens" => 52 }
      )

      expect {
        AiGenerationJob.perform_now(invocation.id)
      }.not_to raise_error

      invocation.reload
      expect(invocation.status).to eq("completed")
      expect(invocation.started_at).to be_present
      expect(invocation.completed_at).to be_present
      expect(invocation.prompt_tokens).to eq(12)
      expect(invocation.completion_tokens).to eq(40)
      expect(invocation.total_tokens).to eq(52)
      expect(invocation.duration_ms).to be_present
    end

    it "records failure message when gateway call fails" do
      allow(AiGatewayClient).to receive(:generate).and_raise(
        AiGatewayClient::AiGatewayError.new("Gateway down", status_code: 502)
      )

      expect {
        AiGenerationJob.perform_now(invocation.id)
      }.not_to raise_error

      invocation.reload
      expect(invocation.status).to eq("failed")
      expect(invocation.error_message).to include("Gateway down")
      expect(invocation.completed_at).to be_present
    end
  end

  private

  def build_request
    Struct.new(:headers, :body).new({}, nil)
  end
end
