require "rails_helper"

RSpec.describe QuizAttemptPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:unrelated_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:quiz) { create(:quiz, tenant: tenant, course: course, created_by: other_teacher, status: "published", attempts_allowed: 10) }
  let(:record) { create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student) }

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
    it "permits admin, owner, and teacher in the quiz course" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(student, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies curriculum lead and unrelated teacher" do
      expect(policy).not_to permit(curriculum_lead, record)
      unrelated_attempt = build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 2)
      expect(policy).not_to permit(unrelated_teacher, unrelated_attempt)
    end
  end

  permissions :create? do
    let(:new_attempt) { build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 2) }

    it "permits enrolled students on published quizzes" do
      expect(policy).to permit(student, new_attempt)
    end

    it "denies admin, curriculum lead, and teachers" do
      expect(policy).not_to permit(admin, new_attempt)
      expect(policy).not_to permit(curriculum_lead, new_attempt)
      expect(policy).not_to permit(teacher, new_attempt)
    end

    it "denies students for draft quizzes" do
      draft_quiz = create(:quiz, tenant: tenant, course: course, created_by: other_teacher, status: "draft")
      draft_attempt = build(:quiz_attempt, tenant: tenant, quiz: draft_quiz, user: student, attempt_number: 1)
      expect(policy).not_to permit(student, draft_attempt)
    end
  end

  permissions :submit? do
    it "permits only owner" do
      expect(policy).to permit(student, record)
      expect(policy).not_to permit(teacher, record)
    end
  end

  permissions :grade_all? do
    it "permits admin and teacher in the quiz course" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies curriculum lead and owner student" do
      expect(policy).not_to permit(curriculum_lead, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:student_attempt) { create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 5) }
    let!(:other_quiz_attempt) do
      other_course = create(:course, tenant: tenant, academic_year: academic_year)
      other_quiz = create(:quiz, tenant: tenant, course: other_course, created_by: other_teacher, status: "published")
      create(:quiz_attempt, tenant: tenant, quiz: other_quiz, user: student)
    end

    it "returns all for admin" do
      scope = described_class::Scope.new(admin, QuizAttempt).resolve
      expect(scope).to include(student_attempt, other_quiz_attempt)
    end

    it "returns managed course attempts for teacher" do
      scope = described_class::Scope.new(teacher, QuizAttempt).resolve
      expect(scope).to include(record, student_attempt)
      expect(scope).not_to include(other_quiz_attempt)
    end

    it "returns own attempts for student" do
      scope = described_class::Scope.new(student, QuizAttempt).resolve
      expect(scope).to include(record, student_attempt, other_quiz_attempt)
    end
  end
end
