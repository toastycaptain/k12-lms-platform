require "rails_helper"
require "webmock/rspec"

RSpec.describe SlackNotifier do
  describe ".send_alert" do
    it "does nothing when webhook URL is not configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("SLACK_ALERT_WEBHOOK_URL").and_return(nil)

      expect(Faraday).not_to receive(:post)
      described_class.send_alert(
        name: "Test",
        metric: "cpu",
        current_value: 90,
        threshold: 80,
        comparison: "gt",
        severity: "warning",
        health_summary: "healthy"
      )
    end

    it "posts alert message to webhook URL" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("SLACK_ALERT_WEBHOOK_URL").and_return("https://hooks.slack.com/test")

      stub = stub_request(:post, "https://hooks.slack.com/test").to_return(status: 200, body: "ok")

      described_class.send_alert(
        name: "Test",
        metric: "cpu",
        current_value: 90,
        threshold: 80,
        comparison: "gt",
        severity: "warning",
        health_summary: "healthy"
      )

      expect(stub).to have_been_requested
    end
  end
end
