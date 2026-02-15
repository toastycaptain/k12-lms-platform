require "rails_helper"

RSpec.describe AttemptAnswerPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:curriculum_lead) { u = create(:user, tenant: tenant); u.add_role(:curriculum_lead); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }
  let(:other_student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:quiz) { create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published") }
  let(:quiz_attempt) { create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "in_progress") }
  let(:question) { create(:question, tenant: tenant) }
  let!(:quiz_item) { create(:quiz_item, tenant: tenant, quiz: quiz, question: question) }
  let(:record) { create(:attempt_answer, tenant: tenant, quiz_attempt: quiz_attempt, question: question) }

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

  permissions :create? do
    it "permits owner while attempt is in progress" do
      expect(policy).to permit(student, record)
    end

    it "denies non-owner" do
      expect(policy).not_to permit(other_student, record)
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
    let!(:own_answer) { record }
    let!(:other_answer) do
      other_course = create(:course, tenant: tenant, academic_year: academic_year)
      other_quiz = create(:quiz, tenant: tenant, course: other_course, created_by: other_student, status: "published")
      other_attempt = create(:quiz_attempt, tenant: tenant, quiz: other_quiz, user: other_student, status: "in_progress")
      other_question = create(:question, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: other_quiz, question: other_question)
      create(:attempt_answer, tenant: tenant, quiz_attempt: other_attempt, question: other_question)
    end

    it "returns all for privileged users" do
      scope = described_class::Scope.new(admin, AttemptAnswer).resolve
      expect(scope).to include(own_answer, other_answer)
    end

    it "returns managed quiz answers for teacher" do
      scope = described_class::Scope.new(teacher, AttemptAnswer).resolve
      expect(scope).to include(own_answer)
      expect(scope).not_to include(other_answer)
    end

    it "returns own attempt answers for student" do
      scope = described_class::Scope.new(student, AttemptAnswer).resolve
      expect(scope).to contain_exactly(own_answer)
    end
  end
end
