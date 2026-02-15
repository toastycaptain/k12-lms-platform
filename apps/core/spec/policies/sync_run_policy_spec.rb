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
    it "permits privileged users and teachers" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end
  end

  permissions :show? do
    it "permits privileged users and owner teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies other teachers" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:own_run) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: teacher) }
    let!(:other_run) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: other_teacher) }

    it "returns all for privileged users" do
      expect(described_class::Scope.new(admin, SyncRun).resolve).to contain_exactly(own_run, other_run)
    end

    it "returns only own runs for teacher" do
      expect(described_class::Scope.new(teacher, SyncRun).resolve).to contain_exactly(own_run)
    end
  end
end
