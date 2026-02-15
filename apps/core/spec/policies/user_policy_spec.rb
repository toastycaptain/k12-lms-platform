require "rails_helper"

RSpec.describe UserPolicy, type: :policy do
  subject { described_class }

  let(:tenant) { create(:tenant) }

  before do
    Current.tenant = tenant
  end

  after { Current.tenant = nil }

  permissions :index? do
    it "grants access to admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)
      expect(subject).to permit(admin, User)
    end

    it "grants access to curriculum leads" do
      curriculum_lead = create(:user, tenant: tenant)
      curriculum_lead.add_role(:curriculum_lead)
      expect(subject).to permit(curriculum_lead, User)
    end

    it "denies access to teachers" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      expect(subject).not_to permit(teacher, User)
    end

    it "denies access to students" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)
      expect(subject).not_to permit(student, User)
    end
  end

  permissions :search? do
    it "grants access to authenticated users" do
      authenticated_user = create(:user, tenant: tenant)
      expect(subject).to permit(authenticated_user, User)
    end
  end

  permissions :show? do
    let(:admin) { create(:user, tenant: tenant) }
    let(:other_user) { create(:user, tenant: tenant) }

    before do
      admin.add_role(:admin)
    end

    it "grants access to admins for any user" do
      expect(subject).to permit(admin, other_user)
    end

    it "grants access to users viewing their own profile" do
      expect(subject).to permit(other_user, other_user)
    end

    it "denies access to users viewing other profiles" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      expect(subject).not_to permit(teacher, other_user)
    end
  end

  permissions :create? do
    it "grants access to admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)
      new_user = build(:user, tenant: tenant)
      expect(subject).to permit(admin, new_user)
    end

    it "denies access to non-admins" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      new_user = build(:user, tenant: tenant)
      expect(subject).not_to permit(teacher, new_user)
    end
  end

  permissions :update? do
    let(:admin) { create(:user, tenant: tenant) }
    let(:other_user) { create(:user, tenant: tenant) }

    before do
      admin.add_role(:admin)
    end

    it "grants access to admins for any user" do
      expect(subject).to permit(admin, other_user)
    end

    it "grants access to users updating their own profile" do
      expect(subject).to permit(other_user, other_user)
    end

    it "denies access to users updating other profiles" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      expect(subject).not_to permit(teacher, other_user)
    end
  end

  permissions :destroy? do
    let(:admin) { create(:user, tenant: tenant) }
    let(:other_user) { create(:user, tenant: tenant) }

    before do
      admin.add_role(:admin)
    end

    it "grants access to admins for other users" do
      expect(subject).to permit(admin, other_user)
    end

    it "denies access to admins deleting themselves" do
      expect(subject).not_to permit(admin, admin)
    end

    it "denies access to non-admins" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      expect(subject).not_to permit(teacher, other_user)
    end
  end

  describe "Scope" do
    let(:admin) { create(:user, tenant: tenant) }
    let(:teacher) { create(:user, tenant: tenant) }
    let!(:user1) { create(:user, tenant: tenant) }
    let!(:user2) { create(:user, tenant: tenant) }

    before do
      admin.add_role(:admin)
      teacher.add_role(:teacher)
    end

    it "returns all users for admins" do
      scope = UserPolicy::Scope.new(admin, User).resolve
      expect(scope).to include(admin, teacher, user1, user2)
    end

    it "returns only self for teachers" do
      scope = UserPolicy::Scope.new(teacher, User).resolve
      expect(scope).to contain_exactly(teacher)
    end
  end
end
