require "rails_helper"

RSpec.describe CoursePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :show? do
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

    it "permits admin users" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      expect(policy).to permit(admin, course)
    end

    it "permits users enrolled in the course" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")

      expect(policy).to permit(teacher, course)
    end

    it "denies users not enrolled in the course" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)

      expect(policy).not_to permit(student, course)
    end
  end

  permissions :gradebook?, :gradebook_export? do
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

    it "permits admin users" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      expect(policy).to permit(admin, course)
    end

    it "permits enrolled teachers" do
      teacher = create(:user, tenant: tenant)
      teacher.add_role(:teacher)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")

      expect(policy).to permit(teacher, course)
    end

    it "denies enrolled students" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)
      section = create(:section, tenant: tenant, course: course, term: term)
      create(:enrollment, tenant: tenant, user: student, section: section, role: "student")

      expect(policy).not_to permit(student, course)
    end
  end

  describe "Scope" do
    let!(:course_a) { create(:course, tenant: tenant, academic_year: academic_year) }
    let!(:course_b) { create(:course, tenant: tenant, academic_year: academic_year) }

    it "returns all courses for admins" do
      admin = create(:user, tenant: tenant)
      admin.add_role(:admin)

      scope = CoursePolicy::Scope.new(admin, Course).resolve

      expect(scope).to include(course_a, course_b)
    end

    it "returns only enrolled courses for students" do
      student = create(:user, tenant: tenant)
      student.add_role(:student)
      section = create(:section, tenant: tenant, course: course_a, term: term)
      create(:enrollment, tenant: tenant, user: student, section: section, role: "student")

      scope = CoursePolicy::Scope.new(student, Course).resolve

      expect(scope).to contain_exactly(course_a)
    end
  end
end
