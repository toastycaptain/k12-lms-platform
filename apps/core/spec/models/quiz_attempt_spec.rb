require "rails_helper"

RSpec.describe QuizAttempt, type: :model do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:quiz) }
    it { should belong_to(:user) }
    it { should have_many(:attempt_answers).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_inclusion_of(:status).in_array(QuizAttempt::VALID_STATUSES) }
    it { should validate_numericality_of(:attempt_number).is_greater_than(0) }
  end

  describe "custom behavior" do
    let(:academic_year) { create(:academic_year, tenant: tenant) }
    let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
    let(:quiz) { create(:quiz, tenant: tenant, course: course, status: "published", attempts_allowed: 2, points_possible: 10, time_limit_minutes: 30) }
    let(:student) { create(:user, tenant: tenant) }

    it "submits an in-progress attempt" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "in_progress", started_at: 5.minutes.ago)
      question = create(:question, :essay, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 5)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, answer: { "text" => "essay" })

      attempt.submit!

      expect(attempt.reload.status).to eq("submitted")
      expect(attempt.submitted_at).to be_present
      expect(attempt.time_spent_seconds).to be > 0
    end

    it "computes effective time limit with accommodation" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student)
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_time_minutes: 15)

      expect(attempt.effective_time_limit).to eq(45)
    end

    it "calculates score and marks graded when all answers graded" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "submitted")
      question = create(:question, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 10)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, points_awarded: 8)

      attempt.calculate_score!

      expect(attempt.reload.score).to eq(8)
      expect(attempt.percentage).to eq(80.0)
      expect(attempt.status).to eq("graded")
    end

    it "enforces attempt limit" do
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 2)
      blocked = build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 3)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Maximum attempts reached")
    end

    it "requires quiz to be published" do
      unpublished_quiz = create(:quiz, tenant: tenant, course: course, status: "draft")
      blocked = build(:quiz_attempt, tenant: tenant, quiz: unpublished_quiz, user: student, attempt_number: 1)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Quiz is not published")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      quiz1 = create(:quiz, tenant: t1, status: "published", attempts_allowed: 10)
      a1 = create(:quiz_attempt, tenant: t1, quiz: quiz1)
      Current.tenant = t2
      quiz2 = create(:quiz, tenant: t2, status: "published", attempts_allowed: 10)
      create(:quiz_attempt, tenant: t2, quiz: quiz2)

      Current.tenant = t1
      expect(QuizAttempt.all).to contain_exactly(a1)
    end
  end
end
