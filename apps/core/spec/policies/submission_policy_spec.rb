require "rails_helper"

RSpec.describe SubmissionPolicy, type: :policy do
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
  let(:other_student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:assignment) { create(:assignment, tenant: tenant, course: course, created_by: other_teacher, status: "published") }
  let(:record) { create(:submission, tenant: tenant, assignment: assignment, user: student) }

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
    it "permits privileged, owner, and managing teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(student, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies other student" do
      expect(policy).not_to permit(other_student, record)
    end
  end

  permissions :create? do
    let(:new_submission) { build(:submission, tenant: tenant, assignment: assignment, user: student) }

    it "permits enrolled students" do
      expect(policy).to permit(student, new_submission)
    end

    it "denies teachers" do
      expect(policy).not_to permit(teacher, new_submission)
    end
  end

  permissions :grade? do
    it "permits privileged and managing teacher" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies student" do
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:teacher_owned_assignment_submission) do
      owner_assignment = create(:assignment, tenant: tenant, course: other_course, created_by: teacher, status: "published")
      create(:submission, tenant: tenant, assignment: owner_assignment, user: other_student)
    end
    let!(:taught_course_submission) do
      create(:submission, tenant: tenant, assignment: assignment, user: other_student)
    end
    let!(:student_own_submission) do
      create(:submission, tenant: tenant, assignment: assignment, user: student)
    end

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, Submission).resolve
      expect(scope).to include(teacher_owned_assignment_submission, taught_course_submission, student_own_submission)
    end

    it "returns managed submissions for teacher" do
      scope = described_class::Scope.new(teacher, Submission).resolve
      expect(scope).to include(teacher_owned_assignment_submission, taught_course_submission, student_own_submission)
    end

    it "returns own submissions for student" do
      scope = described_class::Scope.new(student, Submission).resolve
      expect(scope).to include(student_own_submission)
      expect(scope).not_to include(teacher_owned_assignment_submission)
      expect(scope).not_to include(taught_course_submission)
    end
  end
end
