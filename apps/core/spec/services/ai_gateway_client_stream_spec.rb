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

  describe ".generate_stream" do
    it "yields token chunks and returns full text" do
      request = build_stream_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: nil)

      allow(conn).to receive(:post).with("/v1/generate_stream") do |_path, &block|
        block.call(request)
        request.options.on_data.call("data: {\"content\":\"Hello\"}\n\ndata: {\"content\":\" world\"}\n\n", 0, nil)
        response
      end

      chunks = []
      result = described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages) do |token, _parsed|
        chunks << token
      end

      expect(chunks).to eq([ "Hello", " world" ])
      expect(result).to eq("Hello world")
      expect(request.headers["Authorization"]).to eq("Bearer service-token")
      expect(request.headers["Accept"]).to eq("text/event-stream")
    end

    it "ignores DONE markers and malformed lines" do
      request = build_stream_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: nil)

      allow(conn).to receive(:post).with("/v1/generate_stream") do |_path, &block|
        block.call(request)
        request.options.on_data.call("junk\ndata: [DONE]\n\ndata: {\"content\":\"A\"}\n\n", 0, nil)
        response
      end

      result = described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages)

      expect(result).to eq("A")
    end

    it "handles chunks split across on_data callbacks" do
      request = build_stream_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: nil)

      allow(conn).to receive(:post).with("/v1/generate_stream") do |_path, &block|
        block.call(request)
        request.options.on_data.call("data: {\"content\":\"Hel", 0, nil)
        request.options.on_data.call("lo\"}\n\ndata: {\"content\":\"!\"}\n\n", 0, nil)
        response
      end

      result = described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages)

      expect(result).to eq("Hello!")
    end

    it "yields stream metadata events with nil token" do
      request = build_stream_request
      response = instance_double(Faraday::Response, success?: true, status: 200, body: nil)

      allow(conn).to receive(:post).with("/v1/generate_stream") do |_path, &block|
        block.call(request)
        request.options.on_data.call("data: {\"done\":true,\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":20,\"total_tokens\":30}}\n\n", 0, nil)
        response
      end

      events = []
      result = described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages) do |token, parsed|
        events << { token: token, parsed: parsed }
      end

      expect(result).to eq("")
      expect(events).to include(
        hash_including(
          token: nil,
          parsed: hash_including(
            "usage" => hash_including(
              "prompt_tokens" => 10,
              "completion_tokens" => 20,
              "total_tokens" => 30
            )
          )
        )
      )
    end

    it "raises AiGatewayError when stream endpoint returns non-success status" do
      request = build_stream_request
      response = instance_double(Faraday::Response, success?: false, status: 503, body: { "error" => "unavailable" })

      allow(conn).to receive(:post).with("/v1/generate_stream") do |_path, &block|
        block.call(request)
        response
      end

      expect {
        described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(described_class::AiGatewayError, /AI Gateway stream error: 503/) do |error|
        expect(error.status_code).to eq(503)
        expect(error.response_body).to eq({ "error" => "unavailable" })
      end
    end

    it "raises AiGatewayError on stream timeout" do
      request = build_stream_request
      allow(conn).to receive(:post).with("/v1/generate_stream").and_yield(request).and_raise(Faraday::TimeoutError.new("execution expired"))

      expect {
        described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(described_class::AiGatewayError, /Stream request failed/) do |error|
        expect(error.status_code).to eq(502)
      end
    end

    it "raises AiGatewayError on stream connection failures" do
      request = build_stream_request
      allow(conn).to receive(:post).with("/v1/generate_stream").and_yield(request).and_raise(Faraday::ConnectionFailed.new("timeout"))

      expect {
        described_class.generate_stream(provider: "openai", model: "gpt-4o-mini", messages: messages)
      }.to raise_error(described_class::AiGatewayError, /Stream request failed/) do |error|
        expect(error.status_code).to eq(502)
      end
    end
  end

  private

  def build_stream_request
    options = Struct.new(:timeout, :on_data).new
    Struct.new(:headers, :body, :options).new({}, nil, options)
  end
end
