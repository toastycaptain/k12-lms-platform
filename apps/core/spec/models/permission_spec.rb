require "rails_helper"

RSpec.describe Permission, type: :model do
  let(:tenant) { create(:tenant) }
  let(:role) { create(:role, tenant: tenant, name: "teacher") }

  subject(:permission) { build(:permission, tenant: tenant, role: role) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:role) }
  end

  describe "validations" do
    it { should validate_presence_of(:resource) }
    it { should validate_presence_of(:action) }
    it { should validate_inclusion_of(:resource).in_array(Permission::VALID_RESOURCES) }
    it { should validate_inclusion_of(:action).in_array(Permission::VALID_ACTIONS) }
  end

  describe "uniqueness" do
    it "enforces unique role/resource/action per tenant" do
      create(:permission, tenant: tenant, role: role, resource: "courses", action: "read")

      duplicate = build(:permission, tenant: tenant, role: role, resource: "courses", action: "read")
      different_action = build(:permission, tenant: tenant, role: role, resource: "courses", action: "create")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:role_id]).to include("has already been taken")
      expect(different_action).to be_valid
    end
  end

  describe ".for_role" do
    it "returns only permissions for the given role" do
      target = create(:permission, tenant: tenant, role: role, resource: "courses", action: "read")
      other_role = create(:role, tenant: tenant, name: "student")
      create(:permission, tenant: tenant, role: other_role, resource: "courses", action: "read")

      expect(described_class.for_role(role)).to contain_exactly(target)
    end
  end

  describe ".granted_for" do
    it "returns true when at least one role has a granted permission" do
      create(:permission, tenant: tenant, role: role, resource: "courses", action: "read", granted: true)

      expect(described_class.granted_for(role, :courses, :read)).to be(true)
    end

    it "returns false when no granted permission exists" do
      create(:permission, tenant: tenant, role: role, resource: "courses", action: "read", granted: false)

      expect(described_class.granted_for(role, :courses, :read)).to be(false)
    end
  end
end
