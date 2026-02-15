require "rails_helper"

RSpec.describe IntegrationConfigPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:record) { create(:integration_config, tenant: tenant, created_by: admin) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :activate?, :deactivate?, :sync_courses?, :sync_organizations?, :sync_users? do
    it "permits privileged users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
    end

    it "denies teacher" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:cfg1) { create(:integration_config, tenant: tenant, created_by: admin) }
    let!(:cfg2) { create(:integration_config, tenant: tenant, created_by: admin, provider: "oneroster") }

    it "returns all for privileged users" do
      expect(described_class::Scope.new(admin, IntegrationConfig).resolve).to contain_exactly(cfg1, cfg2)
    end

    it "returns none for teacher" do
      expect(described_class::Scope.new(teacher, IntegrationConfig).resolve).to be_empty
    end
  end
end
