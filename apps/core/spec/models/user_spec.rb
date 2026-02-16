require "rails_helper"

RSpec.describe User, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should have_many(:user_roles).dependent(:destroy) }
    it { should have_many(:roles).through(:user_roles) }
    it { should have_many(:enrollments).dependent(:destroy) }
    it { should have_many(:module_item_completions).dependent(:destroy) }
    it { should have_many(:notifications).dependent(:destroy) }
    it { should have_many(:acted_notifications).class_name("Notification").with_foreign_key(:actor_id).dependent(:nullify) }
    it { should have_many(:message_thread_participants).dependent(:destroy) }
    it { should have_many(:message_threads).through(:message_thread_participants) }
    it { should have_many(:sent_messages).class_name("Message").with_foreign_key(:sender_id).dependent(:destroy) }
  end

  describe "validations" do
    subject(:user) { build(:user, tenant: tenant) }

    it { should validate_presence_of(:email) }

    it "requires tenant when Current.tenant is absent" do
      Current.tenant = nil
      tenantless_user = build(:user, tenant: nil)

      expect(tenantless_user).not_to be_valid
      expect(tenantless_user.errors[:tenant]).to be_present
    end

    it "enforces email uniqueness within a tenant" do
      create(:user, tenant: tenant, email: "same@example.com")
      duplicate = build(:user, tenant: tenant, email: "same@example.com")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end

    it "validates email format" do
      invalid_user = build(:user, tenant: tenant, email: "invalid-email")

      expect(invalid_user).not_to be_valid
      expect(invalid_user.errors[:email]).to be_present
    end

    it "allows valid email format" do
      valid_user = build(:user, tenant: tenant, email: "valid@example.com")

      expect(valid_user).to be_valid
    end
  end

  describe "tenant scoping" do
    let(:tenant1) { create(:tenant) }
    let(:tenant2) { create(:tenant) }

    it "only returns users for the current tenant" do
      Current.tenant = tenant1
      user1 = create(:user, tenant: tenant1)

      Current.tenant = tenant2
      create(:user, tenant: tenant2)

      Current.tenant = tenant1
      expect(User.all).to contain_exactly(user1)
    end

    it "allows same email in different tenants" do
      Current.tenant = nil
      user1 = create(:user, email: "same@example.com", tenant: tenant1)
      user2 = create(:user, email: "same@example.com", tenant: tenant2)

      expect(user1.email).to eq(user2.email)
      expect(user1.tenant_id).not_to eq(user2.tenant_id)
    end
  end

  describe "#has_role?" do
    let(:user) { create(:user, tenant: tenant) }
    let(:teacher_role) { create(:role, :teacher, tenant: tenant) }

    it "returns true when user has the role" do
      create(:user_role, user: user, role: teacher_role)

      expect(user.has_role?(:teacher)).to be(true)
    end

    it "returns false when user does not have the role" do
      expect(user.has_role?(:admin)).to be(false)
    end
  end

  describe "#add_role" do
    let(:user) { create(:user, tenant: tenant) }

    it "creates a new role if it does not exist" do
      expect { user.add_role(:teacher) }.to change(Role, :count).by(1)
    end

    it "reuses existing role if it exists" do
      create(:role, :teacher, tenant: tenant)

      expect { user.add_role(:teacher) }.not_to change(Role, :count)
    end

    it "assigns the role to the user" do
      user.add_role(:teacher)

      expect(user.has_role?(:teacher)).to be(true)
    end

    it "is idempotent" do
      user.add_role(:teacher)

      expect { user.add_role(:teacher) }.not_to change(UserRole, :count)
    end
  end

  describe "#google_connected?" do
    it "returns true when refresh token is present" do
      user = build(:user, tenant: tenant, google_refresh_token: "refresh-token")

      expect(user.google_connected?).to be(true)
    end

    it "returns false when refresh token is blank" do
      user = build(:user, tenant: tenant, google_refresh_token: nil)

      expect(user.google_connected?).to be(false)
    end
  end
end
