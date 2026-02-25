require "rails_helper"

RSpec.describe FeatureFlag, type: :model do
  let!(:tenant) { create(:tenant) }

  describe ".enabled?" do
    it "uses hardcoded defaults when no overrides exist" do
      expect(described_class.enabled?("portfolio_enabled", tenant: tenant)).to be(true)
      expect(described_class.enabled?("new_gradebook", tenant: tenant)).to be(false)
    end

    it "prefers tenant override over defaults" do
      described_class.create!(key: "portfolio_enabled", tenant: tenant, enabled: false)

      expect(described_class.enabled?("portfolio_enabled", tenant: tenant)).to be(false)
    end

    it "uses global override when tenant override is missing" do
      described_class.create!(key: "new_gradebook", tenant: nil, enabled: true)

      expect(described_class.enabled?("new_gradebook", tenant: tenant)).to be(true)
    end
  end
end
