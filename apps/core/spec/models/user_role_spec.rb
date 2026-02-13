require "rails_helper"

RSpec.describe UserRole, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:user) }
    it { should belong_to(:role) }
  end

  describe "validations" do
    subject { create(:user_role) }

    it { should validate_presence_of(:tenant_id) }
    it { should validate_uniqueness_of(:user_id).scoped_to(:role_id) }
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      user1 = create(:user, tenant: tenant1)
      role1 = create(:role, :teacher, tenant: tenant1)
      @user_role1 = create(:user_role, user: user1, role: role1, tenant: tenant1)

      Current.tenant = tenant2
      user2 = create(:user, tenant: tenant2)
      role2 = create(:role, :student, tenant: tenant2)
      @user_role2 = create(:user_role, user: user2, role: role2, tenant: tenant2)
    end

    after { Current.tenant = nil }

    it "only returns user_roles for the current tenant" do
      Current.tenant = tenant1
      expect(UserRole.all).to contain_exactly(@user_role1)
    end
  end

  describe "automatic tenant assignment" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }
    let(:role) { create(:role, :teacher, tenant: tenant) }

    before do
      Current.tenant = tenant
    end

    after { Current.tenant = nil }

    it "automatically sets tenant from user on create" do
      user_role = UserRole.create!(user: user, role: role)
      expect(user_role.tenant_id).to eq(user.tenant_id)
    end
  end

  describe "preventing duplicate role assignments" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }
    let(:role) { create(:role, :teacher, tenant: tenant) }

    before do
      Current.tenant = tenant
      create(:user_role, user: user, role: role)
    end

    after { Current.tenant = nil }

    it "prevents assigning the same role twice to a user" do
      duplicate_user_role = build(:user_role, user: user, role: role)
      expect(duplicate_user_role).not_to be_valid
      expect(duplicate_user_role.errors[:user_id]).to be_present
    end
  end
end
