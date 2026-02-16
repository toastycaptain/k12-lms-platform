require "rails_helper"

RSpec.describe SyncRunPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:integration_config) { create(:integration_config, tenant: tenant, created_by: admin) }
  let(:record) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :show? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(teacher, record)
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:own_run) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: teacher) }
    let!(:other_run) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: other_teacher) }

    it "returns all for admin" do
      expect(described_class::Scope.new(admin, SyncRun).resolve).to contain_exactly(own_run, other_run)
    end

    it "returns none for non-admin users" do
      expect(described_class::Scope.new(curriculum_lead, SyncRun).resolve).to be_empty
      expect(described_class::Scope.new(teacher, SyncRun).resolve).to be_empty
    end
  end
end
