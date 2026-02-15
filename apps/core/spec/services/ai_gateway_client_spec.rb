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
        messages: messages,
        task_type: "lesson_plan",
        max_tokens: 1024,
        temperature: 0.2
      )

      expect(request.body).to eq(
        provider: "openai",
        model: "gpt-4o-mini",
        messages: messages,
        task_type: "lesson_plan",
        max_tokens: 1024,
        temperature: 0.2
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
        messages: messages,
        max_tokens: 4096,
        temperature: 0.7
      )
      expect(request.body).not_to have_key(:task_type)
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
  end

  private

  def build_request
    Struct.new(:headers, :body).new({}, nil)
  end
end
