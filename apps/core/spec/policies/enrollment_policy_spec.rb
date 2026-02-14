require "rails_helper"

RSpec.describe EnrollmentPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :show? do
    let(:student) { create(:user, tenant: tenant) }
    let(:enrollment) { create(:enrollment, tenant: tenant, user: student, section: section, role: "student") }

    before do
      student.add_role(:student)
    end

    it "permits admin users" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      expect(policy).to permit(admin, enrollment)
    end

    it "permits enrollment owners" do
      expect(policy).to permit(student, enrollment)
    end

    it "permits teachers assigned to the section" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")

      expect(policy).to permit(teacher, enrollment)
    end

    it "denies teachers not assigned to the section" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)

      expect(policy).not_to permit(teacher, enrollment)
    end
  end

  describe "Scope" do
    let!(:section_a) { create(:section, tenant: tenant, course: course, term: term) }
    let!(:section_b) { create(:section, tenant: tenant, course: course, term: term) }

    it "returns all enrollments for admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)
      enrollment_a = create(:enrollment, tenant: tenant, section: section_a, role: "student")
      enrollment_b = create(:enrollment, tenant: tenant, section: section_b, role: "student")

      scope = EnrollmentPolicy::Scope.new(admin, Enrollment).resolve

      expect(scope).to include(enrollment_a, enrollment_b)
    end

    it "returns own and taught-section enrollments for teachers" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      teacher_membership = create(:enrollment, tenant: tenant, user: teacher, section: section_a, role: "teacher")
      taught_student = create(:enrollment, tenant: tenant, section: section_a, role: "student")
      other_section_enrollment = create(:enrollment, tenant: tenant, section: section_b, role: "student")

      scope = EnrollmentPolicy::Scope.new(teacher, Enrollment).resolve

      expect(scope).to include(teacher_membership, taught_student)
      expect(scope).not_to include(other_section_enrollment)
    end

    it "returns only own enrollments for students" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)
      own_enrollment = create(:enrollment, tenant: tenant, user: student, section: section_a, role: "student")
      other_enrollment = create(:enrollment, tenant: tenant, section: section_b, role: "student")

      scope = EnrollmentPolicy::Scope.new(student, Enrollment).resolve

      expect(scope).to contain_exactly(own_enrollment)
      expect(scope).not_to include(other_enrollment)
    end
  end
end
