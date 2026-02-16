require "rails_helper"

RSpec.describe QuizAccommodationPolicy, type: :policy do
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
  let(:other_student) { u = create(:user, tenant: tenant); u.add_role(:student); u }

  let(:quiz) { create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published") }
  let(:record) { create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student) }

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
  end

  after { Current.tenant = nil }

  permissions :index? do
    it "permits admin, teacher, and student roles" do
      expect(policy).to permit(admin, record)
      expect(policy).to permit(teacher, record)
      expect(policy).to permit(other_teacher, record)
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
    let!(:student_accommodation) { create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student) }
    let!(:other_student_accommodation) { create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: other_student) }
    let!(:other_course_accommodation) do
      other_quiz = create(:quiz, tenant: tenant, course: other_course, created_by: other_teacher, status: "published")
      create(:quiz_accommodation, tenant: tenant, quiz: other_quiz, user: student)
    end

    it "returns all for admin" do
      resolved = described_class::Scope.new(admin, QuizAccommodation).resolve
      expect(resolved).to include(student_accommodation, other_student_accommodation, other_course_accommodation)
    end

    it "returns taught-course accommodations for teacher" do
      resolved = described_class::Scope.new(teacher, QuizAccommodation).resolve
      expect(resolved).to include(student_accommodation, other_student_accommodation)
      expect(resolved).not_to include(other_course_accommodation)
    end

    it "returns only current student's accommodations in enrolled courses for students" do
      resolved = described_class::Scope.new(student, QuizAccommodation).resolve
      expect(resolved).to include(student_accommodation)
      expect(resolved).not_to include(other_student_accommodation)
      expect(resolved).not_to include(other_course_accommodation)
    end
  end
end
