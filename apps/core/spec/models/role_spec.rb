require "rails_helper"

RSpec.describe Role, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should have_many(:user_roles).dependent(:destroy) }
    it { should have_many(:users).through(:user_roles) }
  end

  describe "validations" do
    subject { build(:role) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:tenant_id) }
    it { should validate_uniqueness_of(:name).scoped_to(:tenant_id) }

    it "validates name is in allowed values" do
      tenant = create(:tenant)
      valid_roles = %w[admin curriculum_lead teacher student guardian]

      valid_roles.each do |role_name|
        role = build(:role, name: role_name, tenant: tenant)
        expect(role).to be_valid
      end

      invalid_role = build(:role, name: "invalid_role", tenant: tenant)
      expect(invalid_role).not_to be_valid
      expect(invalid_role.errors[:name]).to be_present
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    before do
      Current.tenant = tenant1
      @role1 = create(:role, :teacher, tenant: tenant1)

      Current.tenant = tenant2
      @role2 = create(:role, :admin, tenant: tenant2)
    end

    after { Current.tenant = nil }

    it "only returns roles for the current tenant" do
      Current.tenant = tenant1
      expect(Role.all).to contain_exactly(@role1)
    end

    it "allows same role name in different tenants" do
      expect(@role1.name).to eq("teacher")

      Current.tenant = tenant2
      role2 = create(:role, name: "teacher", tenant: tenant2)

      expect(role2.name).to eq("teacher")
      expect(@role1.tenant_id).not_to eq(role2.tenant_id)
    end
  end
end
