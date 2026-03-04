require "rails_helper"

RSpec.describe CourseModulePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:teacher_unenrolled) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:record) { create(:course_module, tenant: tenant, course: course) }
  let!(:section) { create(:section, tenant: tenant, course: course) }

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
      expect(policy).to permit(teacher_unenrolled, record)
    end
  end

  permissions :show? do
    it "permits admin, enrolled teacher, and enrolled student" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(student, record)
    end

    it "denies unenrolled teacher" do
      expect(policy).not_to permit(teacher_unenrolled, record)
    end
  end

  permissions :create?, :update?, :publish?, :archive?, :reorder_items? do
    it "permits admin and enrolled teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student and unenrolled teacher" do
      expect(policy).not_to permit(student, record)
      expect(policy).not_to permit(teacher_unenrolled, record)
    end
  end

  permissions :destroy? do
    it "permits admin only" do
      expect(policy).to permit(admin, record)
      expect(policy).not_to permit(teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let!(:m1) { create(:course_module, tenant: tenant, course: course) }
    let!(:m2) { create(:course_module, tenant: tenant, course: other_course) }

    it "returns course modules the student is enrolled in" do
      expect(described_class::Scope.new(student, CourseModule).resolve).to contain_exactly(m1)
    end

    it "returns all records for admins" do
      expect(described_class::Scope.new(admin, CourseModule).resolve).to contain_exactly(m1, m2, record)
    end
  end
end
