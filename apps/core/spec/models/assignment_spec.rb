require "rails_helper"

RSpec.describe Assignment, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:course) }
    it { should belong_to(:created_by).class_name("User") }
    it { should belong_to(:rubric).optional }
    it { should have_many(:submissions).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(Assignment::VALID_STATUSES) }
    it { should validate_inclusion_of(:assignment_type).in_array(Assignment::VALID_TYPES) }
    it { should validate_numericality_of(:points_possible).is_greater_than_or_equal_to(0) }
  end

  describe "state transitions" do
    it "publishes from draft" do
      assignment = create(:assignment, tenant: tenant, status: "draft")
      assignment.publish!
      expect(assignment.reload.status).to eq("published")
    end

    it "closes from published" do
      assignment = create(:assignment, tenant: tenant, status: "published")
      assignment.close!
      expect(assignment.reload.status).to eq("closed")
    end

    it "archives from any state" do
      assignment = create(:assignment, tenant: tenant, status: "closed")
      assignment.archive!
      expect(assignment.reload.status).to eq("archived")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      a1 = create(:assignment, tenant: t1)
      Current.tenant = t2
      create(:assignment, tenant: t2)

      Current.tenant = t1
      expect(Assignment.all).to contain_exactly(a1)
    end
  end
end
