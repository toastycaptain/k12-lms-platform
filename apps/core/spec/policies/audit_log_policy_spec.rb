require "rails_helper"

RSpec.describe AuditLogPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:record) { create(:audit_log, tenant: tenant, actor: admin) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show? do
    it "permits privileged users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:log1) { create(:audit_log, tenant: tenant, actor: admin) }
    let!(:log2) { create(:audit_log, tenant: tenant, actor: admin) }

    it "returns all for privileged" do
      expect(described_class::Scope.new(admin, AuditLog).resolve).to contain_exactly(log1, log2)
    end

    it "returns none for non-privileged" do
      expect(described_class::Scope.new(teacher, AuditLog).resolve).to be_empty
    end
  end
end
