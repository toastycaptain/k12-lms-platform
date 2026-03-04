require "rails_helper"

RSpec.describe UptimeMonitorJob, type: :job do
  around do |example|
    original_core_url = ENV["CORE_URL"]
    original_railway_core_url = ENV["RAILWAY_SERVICE_K12_CORE_URL"]
    original_ai_gateway_url = ENV["AI_GATEWAY_URL"]

    begin
      ENV.delete("CORE_URL")
      ENV.delete("RAILWAY_SERVICE_K12_CORE_URL")
      ENV.delete("AI_GATEWAY_URL")
      example.run
    ensure
      ENV["CORE_URL"] = original_core_url
      ENV["RAILWAY_SERVICE_K12_CORE_URL"] = original_railway_core_url
      ENV["AI_GATEWAY_URL"] = original_ai_gateway_url
    end
  end

  it "uses Railway core URL and skips AI gateway when AI_GATEWAY_URL is unset" do
    ENV["RAILWAY_SERVICE_K12_CORE_URL"] = "k12-core-production.up.railway.app"
    ok_response = instance_double(Faraday::Response, status: 200)

    allow(Faraday).to receive(:get).and_return(ok_response)
    allow(SlackNotifier).to receive(:send_alert)

    described_class.perform_now

    expect(Faraday).to have_received(:get).once
    expect(Faraday).to have_received(:get).with("https://k12-core-production.up.railway.app/api/v1/health")
    expect(SlackNotifier).not_to have_received(:send_alert)
  end

  it "checks AI gateway health when AI_GATEWAY_URL is configured" do
    ENV["CORE_URL"] = "https://k12-core-production.up.railway.app/"
    ENV["AI_GATEWAY_URL"] = "https://ai-gateway.example.com/"
    ok_response = instance_double(Faraday::Response, status: 200)

    allow(Faraday).to receive(:get).and_return(ok_response)
    allow(SlackNotifier).to receive(:send_alert)

    described_class.perform_now

    expect(Faraday).to have_received(:get).with("https://k12-core-production.up.railway.app/api/v1/health")
    expect(Faraday).to have_received(:get).with("https://ai-gateway.example.com/v1/health")
    expect(SlackNotifier).not_to have_received(:send_alert)
  end
end
