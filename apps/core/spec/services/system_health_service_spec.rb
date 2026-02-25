require "rails_helper"

RSpec.describe SystemHealthService do
  describe ".check_all" do
    it "returns timestamp, checks, and metrics" do
      allow(described_class).to receive(:database_health).and_return({ status: "healthy", latency_ms: 1.0 })
      allow(described_class).to receive(:redis_health).and_return({ status: "healthy", latency_ms: 1.0 })
      allow(described_class).to receive(:sidekiq_health).and_return({ status: "healthy", enqueued: 0, processed: 0, failed: 0, workers: 0 })
      allow(described_class).to receive(:storage_health).and_return({ status: "healthy" })
      allow(described_class).to receive(:ai_gateway_health).and_return({ status: "healthy", http_status: 200 })
      allow(described_class).to receive(:db_connection_pool_usage).and_return(10.0)
      allow(described_class).to receive(:db_response_time).and_return(2.0)
      allow(described_class).to receive(:sidekiq_queue_depth).and_return(0)
      allow(described_class).to receive(:sidekiq_latency).and_return(0.1)
      allow(described_class).to receive(:memory_usage).and_return(20.0)
      allow(described_class).to receive(:backup_age_hours).and_return(6.0)

      result = described_class.check_all
      expect(result).to have_key(:timestamp)
      expect(result).to have_key(:checks)
      expect(result).to have_key(:metrics)
      expect(result[:overall]).to eq("healthy")
    end
  end
end
