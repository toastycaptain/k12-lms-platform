require "rails_helper"

RSpec.describe SyncLogPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:record) { create(:sync_log, tenant: tenant, sync_run: teacher_run) }
  let(:integration_config) { create(:integration_config, tenant: tenant, created_by: admin) }
  let(:teacher_run) { create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: teacher) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits privileged users and teachers" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies students" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:teacher_log) { create(:sync_log, tenant: tenant, sync_run: teacher_run) }
    let!(:other_log) do
      other_run = create(:sync_run, tenant: tenant, integration_config: integration_config, triggered_by: admin)
      create(:sync_log, tenant: tenant, sync_run: other_run)
    end

    it "returns all for privileged users" do
      expect(described_class::Scope.new(admin, SyncLog).resolve).to contain_exactly(teacher_log, other_log)
    end

    it "returns own triggered logs for teachers" do
      expect(described_class::Scope.new(teacher, SyncLog).resolve).to contain_exactly(teacher_log)
    end

    it "returns none for students" do
      expect(described_class::Scope.new(student, SyncLog).resolve).to be_empty
    end
  end
end
