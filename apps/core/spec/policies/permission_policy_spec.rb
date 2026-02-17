require "rails_helper"

RSpec.describe PermissionPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end
  let(:role) { create(:role, tenant: tenant, name: "student") }
  let(:record) { create(:permission, tenant: tenant, role: role) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy? do
    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:permission) { create(:permission, tenant: tenant, role: role) }

    it "returns records for admins" do
      expect(described_class::Scope.new(admin, Permission).resolve).to contain_exactly(permission)
    end

    it "returns none for non-admin users" do
      expect(described_class::Scope.new(teacher, Permission).resolve).to be_empty
    end
  end
end
