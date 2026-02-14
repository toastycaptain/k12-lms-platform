require "rails_helper"
require "webmock/rspec"

RSpec.describe AiGatewayClient do
  let(:base_url) { "http://localhost:8000" }
  let(:client) { described_class.new(base_url: base_url) }

  before do
    WebMock.disable_net_connect!(allow_localhost: false)
  end

  after do
    WebMock.allow_net_connect!
  end

  describe "#generate" do
    it "sends a generate request and returns the response body" do
      stub_request(:post, "#{base_url}/v1/generate")
        .with(
          body: hash_including("provider" => "openai", "model" => "gpt-4o", "prompt" => "Hello"),
          headers: { "Content-Type" => "application/json" }
        )
        .to_return(
          status: 200,
          body: { content: "Generated text", usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      result = client.generate(provider: "openai", model: "gpt-4o", prompt: "Hello")

      expect(result["content"]).to eq("Generated text")
      expect(result["usage"]["total_tokens"]).to eq(30)
    end

    it "sends tenant and user headers when provided" do
      stub_request(:post, "#{base_url}/v1/generate")
        .with(
          headers: { "X-Tenant-ID" => "42", "X-User-ID" => "99" }
        )
        .to_return(
          status: 200,
          body: { content: "OK" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      client.generate(provider: "openai", model: "gpt-4o", prompt: "Hi", tenant_id: 42, user_id: 99)
    end

    it "raises AiGatewayError on 502 response" do
      stub_request(:post, "#{base_url}/v1/generate")
        .to_return(
          status: 502,
          body: { error: "Bad Gateway" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect {
        client.generate(provider: "openai", model: "gpt-4o", prompt: "Hi")
      }.to raise_error(AiGatewayError) { |e|
        expect(e.status_code).to eq(502)
        expect(e.message).to eq("Bad Gateway")
      }
    end

    it "raises AiGatewayError on 500 response" do
      stub_request(:post, "#{base_url}/v1/generate")
        .to_return(
          status: 500,
          body: { error: "Internal Server Error" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect {
        client.generate(provider: "openai", model: "gpt-4o", prompt: "Hi")
      }.to raise_error(AiGatewayError) { |e|
        expect(e.status_code).to eq(500)
      }
    end

    it "sends system_prompt when provided" do
      stub_request(:post, "#{base_url}/v1/generate")
        .with(
          body: hash_including("system_prompt" => "You are helpful")
        )
        .to_return(
          status: 200,
          body: { content: "OK" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      client.generate(provider: "openai", model: "gpt-4o", prompt: "Hi", system_prompt: "You are helpful")
    end

    it "omits nil values from request body" do
      stub_request(:post, "#{base_url}/v1/generate")
        .to_return(
          status: 200,
          body: { content: "OK" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      client.generate(provider: "openai", model: "gpt-4o", prompt: "Hi")

      expect(WebMock).to have_requested(:post, "#{base_url}/v1/generate")
        .with { |req| !JSON.parse(req.body).key?("system_prompt") }
    end
  end

  describe "#health" do
    it "returns health status" do
      stub_request(:get, "#{base_url}/v1/health")
        .to_return(
          status: 200,
          body: { status: "healthy", providers: [ "openai" ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      result = client.health

      expect(result["status"]).to eq("healthy")
    end

    it "raises AiGatewayError when gateway is down" do
      stub_request(:get, "#{base_url}/v1/health")
        .to_return(
          status: 503,
          body: { error: "Service Unavailable" }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      expect {
        client.health
      }.to raise_error(AiGatewayError) { |e|
        expect(e.status_code).to eq(503)
      }
    end
  end

  describe "#providers" do
    it "returns list of providers" do
      stub_request(:get, "#{base_url}/v1/providers")
        .to_return(
          status: 200,
          body: { providers: [ "openai", "anthropic" ] }.to_json,
          headers: { "Content-Type" => "application/json" }
        )

      result = client.providers

      expect(result["providers"]).to eq([ "openai", "anthropic" ])
    end
  end

  describe "#generate_stream" do
    it "accumulates streamed content" do
      sse_body = "data: {\"content\":\"Hello \",\"done\":false}\ndata: {\"content\":\"world\",\"done\":true,\"usage\":{\"prompt_tokens\":5,\"completion_tokens\":2,\"total_tokens\":7}}\n"

      stub_request(:post, "#{base_url}/v1/generate_stream")
        .to_return(
          status: 200,
          body: sse_body,
          headers: { "Content-Type" => "text/event-stream" }
        )

      chunks = []
      result = client.generate_stream(
        provider: "openai", model: "gpt-4o", prompt: "Hi"
      ) { |data| chunks << data }

      expect(result[:content]).to eq("Hello world")
      expect(result[:usage]["total_tokens"]).to eq(7)
      expect(chunks.length).to eq(2)
    end
  end
end
