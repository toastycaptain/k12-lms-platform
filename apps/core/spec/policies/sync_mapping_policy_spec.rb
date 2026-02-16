require "rails_helper"

RSpec.describe SyncMappingPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:integration_config) { create(:integration_config, tenant: tenant, created_by: admin) }
  let(:record) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: integration_config,
      local_type: "Course",
      local_id: 1,
      external_type: "classroom_course")
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :destroy?, :sync_roster? do
    it "permits admin" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:visible) { record }
    let!(:other_record) do
      create(:sync_mapping,
        tenant: tenant,
        integration_config: integration_config,
        local_type: "Section",
        local_id: 2,
        external_type: "classroom_section")
    end

    it "returns all for admin" do
      expect(described_class::Scope.new(admin, SyncMapping).resolve).to contain_exactly(visible, other_record)
    end

    it "returns none for non-admin users" do
      expect(described_class::Scope.new(curriculum_lead, SyncMapping).resolve).to be_empty
      expect(described_class::Scope.new(teacher, SyncMapping).resolve).to be_empty
      expect(described_class::Scope.new(student, SyncMapping).resolve).to be_empty
    end
  end
end
