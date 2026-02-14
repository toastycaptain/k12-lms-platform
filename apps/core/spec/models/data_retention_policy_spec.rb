require "rails_helper"

RSpec.describe DataRetentionPolicy, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:created_by).class_name("User") }
  end

  describe "validations" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:entity_type) }
    it { should validate_inclusion_of(:entity_type).in_array(DataRetentionPolicy::VALID_ENTITY_TYPES) }
    it { should validate_presence_of(:retention_days) }
    it { should validate_numericality_of(:retention_days).is_greater_than_or_equal_to(30) }
    it { should validate_presence_of(:action) }
    it { should validate_inclusion_of(:action).in_array(DataRetentionPolicy::VALID_ACTIONS) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    after { Current.tenant = nil }

    it "isolates records by tenant" do
      Current.tenant = tenant1
      create(:data_retention_policy, tenant: tenant1, created_by: create(:user, tenant: tenant1))

      Current.tenant = tenant2
      create(:data_retention_policy, tenant: tenant2, created_by: create(:user, tenant: tenant2))

      Current.tenant = tenant1
      expect(DataRetentionPolicy.count).to eq(1)
    end
  end
end
