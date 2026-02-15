require "rails_helper"

RSpec.describe SyncMapping, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:integration_config) }
  end

  describe "validations" do
    it { should validate_presence_of(:external_id) }
    it { should validate_inclusion_of(:local_type).in_array(SyncMapping::VALID_LOCAL_TYPES) }
    it { should validate_inclusion_of(:external_type).in_array(SyncMapping::VALID_EXTERNAL_TYPES) }
  end

  describe ".find_local and .find_external" do
    it "finds mappings by local and external ids" do
      config = create(:integration_config, tenant: tenant)
      mapping = create(:sync_mapping,
        tenant: tenant,
        integration_config: config,
        local_type: "Course",
        local_id: 123,
        external_type: "classroom_course",
        external_id: "abc")

      expect(described_class.find_local(config, "Course", 123)).to eq(mapping)
      expect(described_class.find_external(config, "classroom_course", "abc")).to eq(mapping)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      m1 = create(:sync_mapping, tenant: t1)
      Current.tenant = t2
      create(:sync_mapping, tenant: t2)

      Current.tenant = t1
      expect(SyncMapping.all).to contain_exactly(m1)
    end
  end
end
