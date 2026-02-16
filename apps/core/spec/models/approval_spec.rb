require "rails_helper"

RSpec.describe Approval, type: :model do
  let(:tenant) { create(:tenant) }
  let(:requester) { create(:user, tenant: tenant) }
  let(:reviewer) { create(:user, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:unit_plan) { create(:unit_plan, tenant: tenant, course: course, created_by: requester) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:approvable) }
    it { should belong_to(:requested_by).class_name("User") }
    it { should belong_to(:reviewed_by).class_name("User").optional }
  end

  describe "validations" do
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(Approval::VALID_STATUSES) }

    it "requires tenant when Current.tenant is absent" do
      Current.tenant = nil
      approval = build(:approval, tenant: nil, approvable: unit_plan, requested_by: requester)

      expect(approval).not_to be_valid
      expect(approval.errors[:tenant]).to be_present
    end

    it "prevents duplicate pending approvals for the same approvable" do
      create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "pending")
      duplicate = build(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "pending")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors.full_messages.join).to include("A pending approval already exists")
    end

    it "allows non-pending approvals for the same approvable" do
      create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "pending")
      approved = build(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "approved")

      expect(approved).to be_valid
    end
  end

  describe ".pending" do
    it "returns only pending approvals" do
      pending_approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "pending")
      create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "approved")

      expect(described_class.pending).to contain_exactly(pending_approval)
    end
  end

  describe "#approve!" do
    it "transitions from pending to approved" do
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester)

      approval.approve!(reviewer: reviewer)

      approval.reload
      expect(approval.status).to eq("approved")
      expect(approval.reviewed_by).to eq(reviewer)
      expect(approval.reviewed_at).to be_present
    end

    it "raises error when not pending" do
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "approved")

      expect { approval.approve!(reviewer: reviewer) }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#reject!" do
    it "transitions from pending to rejected with comments" do
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester)

      approval.reject!(reviewer: reviewer, comments: "Needs more detail")

      approval.reload
      expect(approval.status).to eq("rejected")
      expect(approval.reviewed_by).to eq(reviewer)
      expect(approval.comments).to eq("Needs more detail")
      expect(approval.reviewed_at).to be_present
    end

    it "raises error when not pending" do
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: requester, status: "rejected")

      expect { approval.reject!(reviewer: reviewer, comments: "No") }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
