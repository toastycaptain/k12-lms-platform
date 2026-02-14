class QuizAttempt < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[in_progress submitted graded].freeze

  belongs_to :quiz
  belongs_to :user
  has_many :attempt_answers, dependent: :destroy

  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :attempt_number, numericality: { greater_than: 0 }
  validates :attempt_number, uniqueness: { scope: [ :quiz_id, :user_id ] }

  validate :within_attempt_limit, on: :create
  validate :quiz_is_available, on: :create

  def submit!
    raise ActiveRecord::RecordInvalid, self unless status == "in_progress"
    update!(
      status: "submitted",
      submitted_at: Time.current,
      time_spent_seconds: (Time.current - started_at).to_i
    )
    grade_auto_gradable_answers!
  end

  def accommodation
    @accommodation ||= QuizAccommodation.find_by(quiz_id: quiz_id, user_id: user_id)
  end

  def effective_time_limit
    return nil unless quiz.time_limit_minutes.present?

    quiz.time_limit_minutes + (accommodation&.extra_time_minutes || 0)
  end

  def calculate_score!
    awarded = attempt_answers.where.not(points_awarded: nil).sum(:points_awarded)
    total = quiz.points_possible.to_d
    pct = total > 0 ? (awarded / total * 100).round(2) : 0
    attrs = { score: awarded, percentage: pct }
    attrs[:status] = "graded" if attempt_answers.where(points_awarded: nil).none?
    update!(attrs)
  end

  private

  def grade_auto_gradable_answers!
    attempt_answers.includes(:question).find_each do |aa|
      aa.auto_grade!
    end
    calculate_score!
  end

  def within_attempt_limit
    return unless quiz

    extra = QuizAccommodation.find_by(quiz_id: quiz_id, user_id: user_id)&.extra_attempts || 0
    max_attempts = quiz.attempts_allowed + extra
    existing_count = QuizAttempt.where(quiz_id: quiz_id, user_id: user_id).count
    if existing_count >= max_attempts
      errors.add(:base, "Maximum attempts reached")
    end
  end

  def quiz_is_available
    return unless quiz

    unless quiz.status == "published"
      errors.add(:base, "Quiz is not published")
      return
    end

    if quiz.unlock_at.present? && Time.current < quiz.unlock_at
      errors.add(:base, "Quiz is not yet available")
    end

    if quiz.lock_at.present? && Time.current > quiz.lock_at
      errors.add(:base, "Quiz is locked")
    end
  end
end
