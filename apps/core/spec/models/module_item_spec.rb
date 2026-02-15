require "rails_helper"

RSpec.describe ModuleItem, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course_module) }
    it { should belong_to(:itemable).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:item_type).in_array(ModuleItem::VALID_ITEM_TYPES) }
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      m1 = create(:module_item, tenant: t1)
      Current.tenant = t2
      create(:module_item, tenant: t2)

      Current.tenant = t1
      expect(ModuleItem.all).to contain_exactly(m1)
    end
  end
end
