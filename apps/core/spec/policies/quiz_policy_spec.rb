require "rails_helper"

RSpec.describe QuizPolicy, type: :policy do
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

  let(:record) { create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published") }

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
    it "permits privileged users and enrolled student for published quiz" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(curriculum_lead, record)
      expect(policy).to permit(student, record)
    end

    it "denies student on draft quiz" do
      draft_record = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      expect(policy).not_to permit(student, draft_record)
    end
  end

  permissions :create?, :update?, :destroy?, :publish?, :close?, :results? do
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
    let!(:teacher_owned_quiz) { create(:quiz, tenant: tenant, course: other_course, created_by: teacher, status: "draft") }
    let!(:taught_course_quiz) { create(:quiz, tenant: tenant, course: course, created_by: other_teacher, status: "draft") }
    let!(:student_visible_quiz) { create(:quiz, tenant: tenant, course: course, created_by: other_teacher, status: "published") }
    let!(:hidden_quiz) { create(:quiz, tenant: tenant, course: other_course, created_by: other_teacher, status: "published") }

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, Quiz).resolve
      expect(scope).to include(teacher_owned_quiz, taught_course_quiz, student_visible_quiz, hidden_quiz)
    end

    it "returns taught-course quizzes for teacher" do
      scope = described_class::Scope.new(teacher, Quiz).resolve
      expect(scope).to include(taught_course_quiz, student_visible_quiz)
      expect(scope).not_to include(teacher_owned_quiz)
      expect(scope).not_to include(hidden_quiz)
    end

    it "returns published quizzes in enrolled courses for students" do
      scope = described_class::Scope.new(student, Quiz).resolve
      expect(scope).to include(student_visible_quiz)
      expect(scope).not_to include(taught_course_quiz)
      expect(scope).not_to include(hidden_quiz)
    end
  end
end
