require "rails_helper"

RSpec.describe QuizAttempt, type: :model do
  include ActiveSupport::Testing::TimeHelpers

  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:quiz) do
    create(
      :quiz,
      tenant: tenant,
      course: course,
      status: "published",
      attempts_allowed: 2,
      points_possible: 10,
      time_limit_minutes: 30,
      unlock_at: nil,
      lock_at: nil
    )
  end
  let(:student) { create(:user, tenant: tenant) }

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

    it "enforces uniqueness of attempt number within quiz and user" do
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      duplicate = build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:attempt_number]).to be_present
    end
  end

  describe "#submit!" do
    it "submits an in-progress attempt and sets submitted metadata" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "in_progress", started_at: 5.minutes.ago)
      question = create(:question, :essay, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 5)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, answer: { "text" => "essay" })

      attempt.submit!

      attempt.reload
      expect(attempt.status).to eq("submitted")
      expect(attempt.submitted_at).to be_present
      expect(attempt.time_spent_seconds).to be > 0
    end

    it "raises when attempt is not in progress" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "submitted")

      expect { attempt.submit! }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "#effective_time_limit" do
    it "uses quiz limit when no accommodation exists" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student)

      expect(attempt.effective_time_limit).to eq(30)
    end

    it "adds accommodation time when present" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student)
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_time_minutes: 15)

      expect(attempt.effective_time_limit).to eq(45)
    end

    it "returns nil when quiz has no time limit" do
      quiz_without_limit = create(:quiz, tenant: tenant, course: course, status: "published", attempts_allowed: 2, time_limit_minutes: nil)
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz_without_limit, user: student)

      expect(attempt.effective_time_limit).to be_nil
    end
  end

  describe "#calculate_score!" do
    it "marks graded when all answers are graded" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "submitted")
      question = create(:question, tenant: tenant)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: question, points: 10)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: question, points_awarded: 8)

      attempt.calculate_score!

      expect(attempt.reload.score).to eq(8)
      expect(attempt.percentage).to eq(80.0)
      expect(attempt.status).to eq("graded")
    end

    it "keeps submitted status when some answers are ungraded" do
      attempt = create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, status: "submitted")
      q1 = create(:question, tenant: tenant)
      q2 = create(:question, tenant: tenant, prompt: "Another prompt")
      create(:quiz_item, tenant: tenant, quiz: quiz, question: q1, points: 5)
      create(:quiz_item, tenant: tenant, quiz: quiz, question: q2, points: 5)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: q1, points_awarded: 4)
      create(:attempt_answer, tenant: tenant, quiz_attempt: attempt, question: q2, points_awarded: nil)

      attempt.calculate_score!

      expect(attempt.reload.score).to eq(4)
      expect(attempt.percentage).to eq(40.0)
      expect(attempt.status).to eq("submitted")
    end

    it "returns zero percentage when quiz total points is zero" do
      zero_point_quiz = create(:quiz, tenant: tenant, course: course, status: "published", attempts_allowed: 2, points_possible: 0)
      attempt = create(:quiz_attempt, tenant: tenant, quiz: zero_point_quiz, user: student, status: "submitted")

      attempt.calculate_score!

      expect(attempt.reload.score).to eq(0)
      expect(attempt.percentage).to eq(0)
    end
  end

  describe "create validations" do
    it "enforces attempt limit" do
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 2)
      blocked = build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 3)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Maximum attempts reached")
    end

    it "allows extra attempts from accommodation" do
      create(:quiz_accommodation, tenant: tenant, quiz: quiz, user: student, extra_attempts: 1)
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 1)
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 2)
      third = build(:quiz_attempt, tenant: tenant, quiz: quiz, user: student, attempt_number: 3)

      expect(third).to be_valid
    end

    it "requires quiz to be published" do
      unpublished_quiz = create(:quiz, tenant: tenant, course: course, status: "draft", attempts_allowed: 2)
      blocked = build(:quiz_attempt, tenant: tenant, quiz: unpublished_quiz, user: student, attempt_number: 1)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Quiz is not published")
    end

    it "requires quiz to be unlocked" do
      future_quiz = create(:quiz, tenant: tenant, course: course, status: "published", attempts_allowed: 2, unlock_at: 1.day.from_now)
      blocked = build(:quiz_attempt, tenant: tenant, quiz: future_quiz, user: student, attempt_number: 1)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Quiz is not yet available")
    end

    it "requires quiz to not be locked" do
      locked_quiz = create(:quiz, tenant: tenant, course: course, status: "published", attempts_allowed: 2, lock_at: 1.day.ago)
      blocked = build(:quiz_attempt, tenant: tenant, quiz: locked_quiz, user: student, attempt_number: 1)

      expect(blocked).not_to be_valid
      expect(blocked.errors.full_messages.join).to include("Quiz is locked")
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
