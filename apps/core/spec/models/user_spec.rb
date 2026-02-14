require "rails_helper"

RSpec.describe User, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should have_many(:user_roles).dependent(:destroy) }
    it { should have_many(:roles).through(:user_roles) }
  end

  describe "validations" do
    subject { build(:user) }

    it { should validate_presence_of(:email) }
    it { should validate_presence_of(:tenant_id) }
    it { should validate_uniqueness_of(:email).scoped_to(:tenant_id) }

    it "validates email format" do
      user = build(:user, email: "invalid-email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "allows valid email format" do
      tenant = create(:tenant)
      user = build(:user, email: "valid@example.com", tenant: tenant)
      expect(user).to be_valid
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      @user1 = create(:user, tenant: tenant1)

      Current.tenant = tenant2
      @user2 = create(:user, tenant: tenant2)
    end

    after { Current.tenant = nil }

    it "only returns users for the current tenant" do
      Current.tenant = tenant1
      expect(User.all).to contain_exactly(@user1)
    end

    it "allows same email in different tenants" do
      Current.tenant = tenant1
      user1 = create(:user, email: "same@example.com", tenant: tenant1)

      Current.tenant = tenant2
      user2 = create(:user, email: "same@example.com", tenant: tenant2)

      expect(user1.email).to eq(user2.email)
      expect(user1.tenant_id).not_to eq(user2.tenant_id)
    end
  end

  describe "#has_role?" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }
    let(:teacher_role) { create(:role, :teacher, tenant: tenant) }

    before do
      Current.tenant = tenant
    end

    after { Current.tenant = nil }

    it "returns true when user has the role" do
      create(:user_role, user: user, role: teacher_role)
      expect(user.has_role?(:teacher)).to be true
    end

    it "returns false when user does not have the role" do
      expect(user.has_role?(:admin)).to be false
    end
  end

  describe "#add_role" do
    let(:tenant) { create(:tenant) }
    let(:user) { create(:user, tenant: tenant) }

    before do
      Current.tenant = tenant
    end

    after { Current.tenant = nil }

    it "creates a new role if it doesn't exist" do
      expect {
        user.add_role(:teacher)
      }.to change(Role, :count).by(1)
    end

    it "reuses existing role if it exists" do
      create(:role, :teacher, tenant: tenant)

      expect {
        user.add_role(:teacher)
      }.not_to change(Role, :count)
    end

    it "assigns the role to the user" do
      user.add_role(:teacher)
      expect(user.has_role?(:teacher)).to be true
    end

    it "is idempotent" do
      user.add_role(:teacher)
      user.add_role(:teacher)
      expect(user.user_roles.count).to eq(1)
    end
  end
end
