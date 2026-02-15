require "rails_helper"

RSpec.describe UnitVersion, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:unit_plan) }
    it { should have_many(:unit_version_standards).dependent(:destroy) }
    it { should have_many(:standards).through(:unit_version_standards) }
    it { should have_many(:resource_links).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:version_number) }
    it { should validate_presence_of(:title) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      u1 = create(:unit_version, tenant: t1)
      Current.tenant = t2
      create(:unit_version, tenant: t2)

      Current.tenant = t1
      expect(UnitVersion.all).to contain_exactly(u1)
    end
  end
end
