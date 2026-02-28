require "rails_helper"

RSpec.describe GoalPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

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

  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:other_student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:goal) { create(:goal, tenant: tenant, student: student) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
    create(:guardian_link, tenant: tenant, guardian: guardian, student: student, status: "active")
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  permissions :show? do
    it "permits admins" do
      expect(policy).to permit(admin, goal)
    end

    it "permits owners" do
      expect(policy).to permit(student, goal)
    end

    it "permits shared teachers" do
      expect(policy).to permit(teacher, goal)
    end

    it "permits linked guardians" do
      expect(policy).to permit(guardian, goal)
    end

    it "denies other students" do
      expect(policy).not_to permit(other_student, goal)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits students on their own goals" do
      expect(policy).to permit(student, goal)
    end

    it "denies teachers" do
      expect(policy).not_to permit(teacher, goal)
    end

    it "denies admins" do
      expect(policy).not_to permit(admin, goal)
    end
  end

  describe "Scope" do
    it "returns only own goals for students" do
      other_goal = create(:goal, tenant: tenant, student: other_student)
      scope = described_class::Scope.new(student, Goal).resolve
      expect(scope).to contain_exactly(goal)
      expect(scope).not_to include(other_goal)
    end

    it "returns shared students for teachers" do
      shared_goal = create(:goal, tenant: tenant, student: student)
      outside_goal = create(:goal, tenant: tenant, student: other_student)

      scope = described_class::Scope.new(teacher, Goal).resolve
      expect(scope).to include(shared_goal)
      expect(scope).not_to include(outside_goal)
    end
  end
end
