require "rails_helper"

RSpec.describe CourseModule, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should have_many(:module_items).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(CourseModule::VALID_STATUSES) }
  end

  describe "state transitions" do
    it "publishes from draft" do
      mod = create(:course_module, tenant: tenant, status: "draft")
      mod.publish!
      expect(mod.reload.status).to eq("published")
    end

    it "archives from published" do
      mod = create(:course_module, tenant: tenant, status: "published")
      mod.archive!
      expect(mod.reload.status).to eq("archived")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      m1 = create(:course_module, tenant: t1)
      Current.tenant = t2
      create(:course_module, tenant: t2)

      Current.tenant = t1
      expect(CourseModule.all).to contain_exactly(m1)
    end
  end
end
