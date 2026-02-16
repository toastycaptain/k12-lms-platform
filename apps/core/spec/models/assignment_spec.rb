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
    it { should have_many(:assignment_standards).dependent(:destroy) }
    it { should have_many(:standards).through(:assignment_standards) }
  end

  describe "validations" do
    it { should validate_presence_of(:title) }
    it { should validate_inclusion_of(:status).in_array(Assignment::VALID_STATUSES) }
    it { should validate_inclusion_of(:assignment_type).in_array(Assignment::VALID_TYPES) }
    it { should validate_numericality_of(:points_possible).is_greater_than_or_equal_to(0) }

    it "allows nil optional numeric fields" do
      assignment = build(:assignment, tenant: tenant, points_possible: nil)

      expect(assignment).to be_valid
    end

    it "rejects invalid status values" do
      assignment = build(:assignment, tenant: tenant, status: "unknown")

      expect(assignment).not_to be_valid
      expect(assignment.errors[:status]).to be_present
    end

    it "requires a tenant" do
      Current.tenant = nil
      assignment = build(:assignment, tenant: nil)

      expect(assignment).not_to be_valid
      expect(assignment.errors[:tenant]).to be_present
    end
  end

  describe "state transitions" do
    it "publishes from draft" do
      assignment = create(:assignment, tenant: tenant, status: "draft")

      assignment.publish!

      expect(assignment.reload.status).to eq("published")
    end

    it "raises when publishing from non-draft" do
      assignment = create(:assignment, tenant: tenant, status: "published")

      expect { assignment.publish! }.to raise_error(ActiveRecord::RecordInvalid)
      expect(assignment.reload.status).to eq("published")
    end

    it "closes from published" do
      assignment = create(:assignment, tenant: tenant, status: "published")

      assignment.close!

      expect(assignment.reload.status).to eq("closed")
    end

    it "raises when closing from non-published" do
      assignment = create(:assignment, tenant: tenant, status: "draft")

      expect { assignment.close! }.to raise_error(ActiveRecord::RecordInvalid)
      expect(assignment.reload.status).to eq("draft")
    end

    it "archives from any state" do
      assignment = create(:assignment, tenant: tenant, status: "closed")

      assignment.archive!

      expect(assignment.reload.status).to eq("archived")
    end
  end

  describe "dependent behavior" do
    it "destroys associated submissions when destroyed" do
      assignment = create(:assignment, tenant: tenant)
      create(:submission, tenant: tenant, assignment: assignment)

      expect { assignment.destroy! }.to change(Submission, :count).by(-1)
    end

    it "destroys associated assignment standards when destroyed" do
      assignment = create(:assignment, tenant: tenant)
      standard_framework = create(:standard_framework, tenant: tenant)
      standard = create(:standard, tenant: tenant, standard_framework: standard_framework)
      assignment.assignment_standards.create!(tenant: tenant, standard: standard)

      expect { assignment.destroy! }.to change(AssignmentStandard, :count).by(-1)
    end
  end

  describe "numeric boundaries" do
    it "accepts zero points_possible" do
      assignment = build(:assignment, tenant: tenant, points_possible: 0)

      expect(assignment).to be_valid
    end

    it "rejects negative points_possible" do
      assignment = build(:assignment, tenant: tenant, points_possible: -1)

      expect(assignment).not_to be_valid
      expect(assignment.errors[:points_possible]).to be_present
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
