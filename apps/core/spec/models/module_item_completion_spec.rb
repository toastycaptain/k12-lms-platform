require "rails_helper"

RSpec.describe ModuleItemCompletion, type: :model do
  let(:tenant) { create(:tenant) }
  subject(:module_item_completion) { build(:module_item_completion, tenant: tenant, completed_at: Time.current) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:module_item) }
  end

  describe "validations" do
    it { should validate_presence_of(:completed_at) }

    it "enforces one completion per user per module item" do
      existing = create(:module_item_completion, tenant: tenant)
      duplicate = build(
        :module_item_completion,
        tenant: tenant,
        user: existing.user,
        module_item: existing.module_item,
        completed_at: Time.current
      )

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:module_item_id]).to include("has already been taken")
    end
  end

  describe "tenant scoping" do
    it "returns records for the active tenant only" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      c1 = create(:module_item_completion, tenant: t1)
      Current.tenant = t2
      create(:module_item_completion, tenant: t2)

      Current.tenant = t1
      expect(ModuleItemCompletion.all).to contain_exactly(c1)
    end
  end
end
