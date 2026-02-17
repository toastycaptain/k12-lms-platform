require "rails_helper"

RSpec.describe MetricsService, type: :service do
  let(:logger) { instance_double(ActiveSupport::Logger, info: true, warn: true) }

  before do
    allow(Rails).to receive(:logger).and_return(logger)
  end

  describe ".increment" do
    it "emits a counter metric payload" do
      described_class.increment("api.request.total", tags: { status: 200, path: "/api/v1/health" })

      expect(logger).to have_received(:info) do |payload|
        data = JSON.parse(payload)
        expect(data["type"]).to eq("counter")
        expect(data["metric"]).to eq("api.request.total")
        expect(data["value"]).to eq(1)
        expect(data["tags"]).to include("status" => 200, "path" => "/api/v1/health")
      end
    end
  end

  describe ".timing" do
    it "emits a timing metric payload" do
      described_class.timing("api.request.duration_ms", 123.456, tags: { method: "GET" })

      expect(logger).to have_received(:info) do |payload|
        data = JSON.parse(payload)
        expect(data["type"]).to eq("timing")
        expect(data["metric"]).to eq("api.request.duration_ms")
        expect(data["value"]).to eq(123.5)
        expect(data["tags"]).to include("method" => "GET")
      end
    end
  end

  describe ".gauge" do
    it "emits a gauge metric payload" do
      described_class.gauge("sidekiq.queue.size", 12, tags: { queue: "default" })

      expect(logger).to have_received(:info) do |payload|
        data = JSON.parse(payload)
        expect(data["type"]).to eq("gauge")
        expect(data["metric"]).to eq("sidekiq.queue.size")
        expect(data["value"]).to eq(12)
        expect(data["tags"]).to include("queue" => "default")
      end
    end
  end
end
