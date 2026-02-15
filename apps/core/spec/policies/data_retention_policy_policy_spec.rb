require "rails_helper"

RSpec.describe DataRetentionPolicyPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :enforce? do
    let(:admin) do
      user = create(:user, tenant: tenant)
      user.add_role(:admin)
      user
    end
    let(:teacher) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let(:record) { create(:data_retention_policy, tenant: tenant, created_by: admin) }

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:record) { create(:data_retention_policy, tenant: tenant, created_by: admin) }
    let(:admin) do
      user = create(:user, tenant: tenant)
      user.add_role(:admin)
      user
    end
    let(:curriculum_lead) do
      user = create(:user, tenant: tenant)
      user.add_role(:curriculum_lead)
      user
    end

    it "returns records for admins" do
      scope = DataRetentionPolicyPolicy::Scope.new(admin, DataRetentionPolicy).resolve
      expect(scope).to include(record)
    end

    it "returns no records for non-admin users" do
      scope = DataRetentionPolicyPolicy::Scope.new(curriculum_lead, DataRetentionPolicy).resolve
      expect(scope).to be_empty
    end
  end
end
