require "rails_helper"

RSpec.describe OnboardingChecklistService do
  let!(:tenant) { create(:tenant) }

  after { Current.tenant = nil }

  describe "#call" do
    it "returns checklist with completion percentage" do
      result = described_class.new(tenant).call

      expect(result[:tenant_id]).to eq(tenant.id)
      expect(result[:completion_percentage]).to be_a(Integer)
      expect(result[:items]).to be_an(Array)
      expect(result[:items].length).to eq(10)
    end

    it "marks admin_created as true when an admin exists" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      user.add_role(:admin)
      Current.tenant = nil

      result = described_class.new(tenant).call
      admin_item = result[:items].find { |item| item[:key] == "admin_created" }

      expect(admin_item[:done]).to be(true)
    end
  end
end
