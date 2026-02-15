require "rails_helper"

RSpec.describe ApprovalPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:record) { create(:approval, tenant: tenant, requested_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :approve?, :reject? do
    it "permits privileged users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:approval1) { create(:approval, tenant: tenant, requested_by: teacher) }
    let!(:approval2) { create(:approval, tenant: tenant, requested_by: teacher) }

    it "returns all for privileged users" do
      expect(described_class::Scope.new(admin, Approval).resolve).to contain_exactly(approval1, approval2)
    end

    it "returns none for teacher" do
      expect(described_class::Scope.new(teacher, Approval).resolve).to be_empty
    end
  end
end
