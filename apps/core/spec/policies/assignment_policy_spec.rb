require "rails_helper"

RSpec.describe AssignmentPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:record) { create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "published") }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
  end

  after { Current.tenant = nil }

  permissions :index? do
    it "permits all users" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end
  end

  permissions :show? do
    it "permits privileged users and enrolled student for published assignment" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(student, record)
    end

    it "denies student on draft assignment" do
      draft_record = create(:assignment, tenant: tenant, course: course, created_by: teacher, status: "draft")
      expect(policy).not_to permit(student, draft_record)
    end
  end

  permissions :create?, :update?, :destroy?, :publish?, :close?, :push_to_classroom?, :sync_grades? do
    it "permits privileged users and teaching teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies non-teaching teacher" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:teacher_owned_assignment) do
      create(:assignment, tenant: tenant, course: other_course, created_by: teacher, status: "draft")
    end
    let!(:taught_course_assignment) do
      create(:assignment, tenant: tenant, course: course, created_by: other_teacher, status: "draft")
    end
    let!(:student_visible_assignment) do
      create(:assignment, tenant: tenant, course: course, created_by: other_teacher, status: "closed")
    end
    let!(:hidden_assignment) do
      create(:assignment, tenant: tenant, course: other_course, created_by: other_teacher, status: "published")
    end

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, Assignment).resolve
      expect(scope).to include(teacher_owned_assignment, taught_course_assignment, student_visible_assignment, hidden_assignment)
    end

    it "returns owned and taught-course assignments for teacher" do
      scope = described_class::Scope.new(teacher, Assignment).resolve
      expect(scope).to include(teacher_owned_assignment, taught_course_assignment, student_visible_assignment)
      expect(scope).not_to include(hidden_assignment)
    end

    it "returns published/closed assignments in enrolled courses for students" do
      scope = described_class::Scope.new(student, Assignment).resolve
      expect(scope).to include(student_visible_assignment)
      expect(scope).not_to include(taught_course_assignment)
      expect(scope).not_to include(hidden_assignment)
    end
  end
end
