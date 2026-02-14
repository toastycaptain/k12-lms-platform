require "rails_helper"

RSpec.describe RlsTenant do
  describe ".enabled?" do
    it "returns false when ENABLE_RLS is not set" do
      allow(ENV).to receive(:fetch).with("ENABLE_RLS", "false").and_return("false")
      expect(described_class.enabled?).to be false
    end

    it "returns true when ENABLE_RLS is true" do
      allow(ENV).to receive(:fetch).with("ENABLE_RLS", "false").and_return("true")
      expect(described_class.enabled?).to be true
    end
  end

  describe ".set_current_tenant" do
    it "does nothing when RLS is disabled" do
      allow(ENV).to receive(:fetch).with("ENABLE_RLS", "false").and_return("false")
      expect(ActiveRecord::Base.connection).not_to receive(:execute)
      described_class.set_current_tenant(1)
    end
  end
end
