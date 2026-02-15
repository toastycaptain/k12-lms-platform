require "rails_helper"

RSpec.describe DataRetentionPolicy, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:retention_days) }
    it { should validate_numericality_of(:retention_days).is_greater_than(0) }
    it { should validate_inclusion_of(:action).in_array(DataRetentionPolicy::VALID_ACTIONS) }
    it { should validate_inclusion_of(:entity_type).in_array(DataRetentionPolicy::VALID_ENTITY_TYPES) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      p1 = create(:data_retention_policy, tenant: t1)
      Current.tenant = t2
      create(:data_retention_policy, tenant: t2)

      Current.tenant = t1
      expect(DataRetentionPolicy.all).to contain_exactly(p1)
    end
  end
end
