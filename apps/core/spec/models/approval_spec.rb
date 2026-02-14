require "rails_helper"

RSpec.describe Approval, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:approvable) }
    it { should belong_to(:requested_by).class_name("User") }
    it { should belong_to(:reviewed_by).class_name("User").optional }
  end

  describe "validations" do
    it { should validate_presence_of(:status) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "#approve!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions from pending to approved" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      reviewer = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: user)

      approval.approve!(reviewer: reviewer)

      expect(approval.reload.status).to eq("approved")
      expect(approval.reviewed_by).to eq(reviewer)
      expect(approval.reviewed_at).to be_present
    end

    it "raises error when not pending" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      reviewer = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: user, status: "approved")

      expect { approval.approve!(reviewer: reviewer) }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#reject!" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "transitions from pending to rejected with comments" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      reviewer = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: user)

      approval.reject!(reviewer: reviewer, comments: "Needs more detail")

      expect(approval.reload.status).to eq("rejected")
      expect(approval.reviewed_by).to eq(reviewer)
      expect(approval.comments).to eq("Needs more detail")
      expect(approval.reviewed_at).to be_present
    end

    it "raises error when not pending" do
      ay = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: ay)
      user = create(:user, tenant: tenant)
      reviewer = create(:user, tenant: tenant)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: user)
      approval = create(:approval, tenant: tenant, approvable: unit_plan, requested_by: user, status: "rejected")

      expect { approval.reject!(reviewer: reviewer, comments: "No") }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end
