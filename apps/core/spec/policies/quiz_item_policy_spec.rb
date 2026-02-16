require "rails_helper"

RSpec.describe QuizItemPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:other_course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let(:admin) { u = create(:user, tenant: tenant); u.add_role(:admin); u }
  let(:teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:other_teacher) { u = create(:user, tenant: tenant); u.add_role(:teacher); u }
  let(:student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:question_bank) { create(:question_bank, tenant: tenant, created_by: teacher) }
  let(:question) { create(:question, tenant: tenant, question_bank: question_bank, created_by: teacher) }
  let(:quiz) { create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published") }
  let(:record) { create(:quiz_item, tenant: tenant, quiz: quiz, question: question) }

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

  permissions :create?, :update?, :destroy? do
    it "permits admin and teacher in the quiz course" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
    end

    it "denies unrelated teachers and students" do
      expect(policy).not_to permit(other_teacher, record)
      expect(policy).not_to permit(student, record)
    end
  end

  describe "Scope" do
    let!(:published_item) { record }
    let!(:draft_item) do
      draft_quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "draft")
      create(:quiz_item, tenant: tenant, quiz: draft_quiz, question: question)
    end
    let!(:other_course_item) do
      other_quiz = create(:quiz, tenant: tenant, course: other_course, created_by: other_teacher, status: "published")
      create(:quiz_item, tenant: tenant, quiz: other_quiz, question: question)
    end

    it "returns all for admin" do
      resolved = described_class::Scope.new(admin, QuizItem).resolve
      expect(resolved).to include(published_item, draft_item, other_course_item)
    end

    it "returns all items in taught courses for teachers" do
      resolved = described_class::Scope.new(teacher, QuizItem).resolve
      expect(resolved).to include(published_item, draft_item)
      expect(resolved).not_to include(other_course_item)
    end

    it "returns only published items in enrolled courses for students" do
      resolved = described_class::Scope.new(student, QuizItem).resolve
      expect(resolved).to include(published_item)
      expect(resolved).not_to include(draft_item)
      expect(resolved).not_to include(other_course_item)
    end
  end
end
