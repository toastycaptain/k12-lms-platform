require "rails_helper"

RSpec.describe Submission, type: :model do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:assignment) }
    it { should belong_to(:user) }
    it { should belong_to(:graded_by).class_name("User").optional }
    it { should have_many(:rubric_scores).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_inclusion_of(:status).in_array(Submission::VALID_STATUSES) }

    it "enforces one submission per assignment per user" do
      assignment = create(:assignment, tenant: tenant)
      student = create(:user, tenant: tenant)
      create(:submission, tenant: tenant, assignment: assignment, user: student)
      duplicate = build(:submission, tenant: tenant, assignment: assignment, user: student)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to include("already has a submission for this assignment")
    end

    it "validates grade does not exceed assignment points" do
      assignment = create(:assignment, tenant: tenant, points_possible: 10)
      submission = build(:submission, tenant: tenant, assignment: assignment, grade: 11)

      expect(submission).not_to be_valid
      expect(submission.errors[:grade]).to include("cannot exceed assignment points possible")
    end

    it "allows grade equal to assignment points" do
      assignment = create(:assignment, tenant: tenant, points_possible: 10)
      submission = build(:submission, tenant: tenant, assignment: assignment, grade: 10)

      expect(submission).to be_valid
    end

    it "allows nil grade" do
      assignment = create(:assignment, tenant: tenant, points_possible: 10)
      submission = build(:submission, tenant: tenant, assignment: assignment, grade: nil)

      expect(submission).to be_valid
    end
  end

  describe "#submit!" do
    it "submits when assignment is published and unlocked" do
      assignment = create(:assignment, tenant: tenant, status: "published", lock_at: nil)
      submission = create(:submission, tenant: tenant, assignment: assignment, status: "draft")

      submission.submit!

      expect(submission.reload.status).to eq("submitted")
      expect(submission.submitted_at).to be_present
    end

    it "raises when submission is not draft" do
      assignment = create(:assignment, tenant: tenant, status: "published")
      submission = create(:submission, tenant: tenant, assignment: assignment, status: "submitted")

      expect { submission.submit! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises when assignment is not published" do
      assignment = create(:assignment, tenant: tenant, status: "draft")
      submission = create(:submission, tenant: tenant, assignment: assignment, status: "draft")

      expect { submission.submit! }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises when assignment is locked" do
      assignment = create(:assignment, tenant: tenant, status: "published", lock_at: 1.hour.ago)
      submission = create(:submission, tenant: tenant, assignment: assignment, status: "draft")

      expect { submission.submit! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "dependent behavior" do
    it "destroys rubric scores when submission is destroyed" do
      submission = create(:submission, tenant: tenant)
      criterion = create(:rubric_criterion, tenant: tenant)
      create(:rubric_score, tenant: tenant, submission: submission, rubric_criterion: criterion)

      expect { submission.destroy! }.to change(RubricScore, :count).by(-1)
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      s1 = create(:submission, tenant: t1)
      Current.tenant = t2
      create(:submission, tenant: t2)

      Current.tenant = t1
      expect(Submission.all).to contain_exactly(s1)
    end
  end
end
