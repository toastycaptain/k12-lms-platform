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

    it "validates grade does not exceed assignment points" do
      assignment = create(:assignment, tenant: tenant, points_possible: 10)
      submission = build(:submission, tenant: tenant, assignment: assignment, grade: 11)

      expect(submission).not_to be_valid
      expect(submission.errors[:grade]).to include("cannot exceed assignment points possible")
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

    it "raises when assignment is not published" do
      assignment = create(:assignment, tenant: tenant, status: "draft")
      submission = create(:submission, tenant: tenant, assignment: assignment, status: "draft")

      expect { submission.submit! }.to raise_error(ActiveRecord::RecordInvalid)
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
