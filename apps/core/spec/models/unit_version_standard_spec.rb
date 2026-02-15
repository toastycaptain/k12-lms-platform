require "rails_helper"

RSpec.describe UnitVersionStandard, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:unit_version) }
    it { should belong_to(:standard) }
  end

  describe "validations" do
    it "validates uniqueness of standard scoped to unit version" do
      unit_version = create(:unit_version, tenant: tenant)
      standard = create(:standard, tenant: tenant)
      create(:unit_version_standard, tenant: tenant, unit_version: unit_version, standard: standard)
      duplicate = build(:unit_version_standard, tenant: tenant, unit_version: unit_version, standard: standard)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:standard_id]).to include("has already been taken")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      u1 = create(:unit_version_standard, tenant: t1)
      Current.tenant = t2
      create(:unit_version_standard, tenant: t2)

      Current.tenant = t1
      expect(UnitVersionStandard.all).to contain_exactly(u1)
    end
  end
end
