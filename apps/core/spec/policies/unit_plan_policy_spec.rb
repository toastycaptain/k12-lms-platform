require "rails_helper"

RSpec.describe UnitPlanPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :show? do
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let(:owner) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let(:unit_plan) { create(:unit_plan, tenant: tenant, course: course, created_by: owner) }

    it "permits admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      expect(policy).to permit(admin, unit_plan)
    end

    it "permits unit plan owners" do
      expect(policy).to permit(owner, unit_plan)
    end

    it "permits teachers assigned to the course" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")

      expect(policy).to permit(teacher, unit_plan)
    end

    it "denies teachers without course membership" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)

      expect(policy).not_to permit(teacher, unit_plan)
    end
  end

  permissions :update? do
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let(:owner) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let(:unit_plan) { create(:unit_plan, tenant: tenant, course: course, created_by: owner) }

    it "permits owners" do
      expect(policy).to permit(owner, unit_plan)
    end

    it "denies non-owner teachers" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)

      expect(policy).not_to permit(teacher, unit_plan)
    end
  end

  describe "Scope" do
    let!(:course_taught) { create(:course, tenant: tenant, academic_year: academic_year) }
    let!(:course_other) { create(:course, tenant: tenant, academic_year: academic_year) }
    let!(:owner_teacher) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let!(:other_teacher) do
      user = create(:user, tenant: tenant)
      user.add_role(:teacher)
      user
    end
    let!(:owned_plan) { create(:unit_plan, tenant: tenant, course: course_other, created_by: owner_teacher) }
    let!(:taught_plan) { create(:unit_plan, tenant: tenant, course: course_taught, created_by: other_teacher) }
    let!(:hidden_plan) { create(:unit_plan, tenant: tenant, course: course_other, created_by: other_teacher) }

    it "returns all unit plans for admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      scope = UnitPlanPolicy::Scope.new(admin, UnitPlan).resolve

      expect(scope).to include(owned_plan, taught_plan, hidden_plan)
    end

    it "returns owned and taught-course plans for teachers" do
      section = create(:section, tenant: tenant, course: course_taught, term: term)
      create(:enrollment, tenant: tenant, user: owner_teacher, section: section, role: "teacher")

      scope = UnitPlanPolicy::Scope.new(owner_teacher, UnitPlan).resolve

      expect(scope).to contain_exactly(owned_plan, taught_plan)
      expect(scope).not_to include(hidden_plan)
    end

    it "returns no plans for students" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)

      scope = UnitPlanPolicy::Scope.new(student, UnitPlan).resolve

      expect(scope).to be_empty
    end
  end
end
