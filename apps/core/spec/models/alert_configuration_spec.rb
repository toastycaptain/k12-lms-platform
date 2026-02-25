require "rails_helper"

RSpec.describe AlertConfiguration, type: :model do
  describe "validations" do
    it "is valid with valid attributes" do
      config = described_class.new(
        name: "Test Alert",
        metric: "db_connection_pool",
        comparison: "gt",
        threshold: 80,
        severity: "warning",
        notification_channel: "slack"
      )

      expect(config).to be_valid
    end

    it "rejects invalid metric" do
      config = described_class.new(metric: "invalid")
      expect(config).not_to be_valid
      expect(config.errors[:metric]).to be_present
    end

    it "rejects invalid comparison" do
      config = described_class.new(comparison: "invalid")
      expect(config).not_to be_valid
    end
  end

  describe "#evaluate" do
    let(:config) { described_class.new(comparison: "gt", threshold: 80) }

    it "returns true when value exceeds threshold" do
      expect(config.evaluate(90)).to be(true)
    end

    it "returns false when value is below threshold" do
      expect(config.evaluate(70)).to be(false)
    end
  end

  describe "#in_cooldown?" do
    it "returns false when never triggered" do
      config = described_class.new(cooldown_minutes: 30, last_triggered_at: nil)
      expect(config.in_cooldown?).to be(false)
    end

    it "returns true when triggered within cooldown" do
      config = described_class.new(cooldown_minutes: 30, last_triggered_at: 10.minutes.ago)
      expect(config.in_cooldown?).to be(true)
    end
  end
end
