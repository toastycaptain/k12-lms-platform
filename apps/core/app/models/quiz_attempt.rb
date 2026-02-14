class QuizAttempt < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[in_progress submitted graded].freeze

  belongs_to :quiz
  belongs_to :user

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
  end

  private

  def within_attempt_limit
    return unless quiz

    existing_count = QuizAttempt.where(quiz_id: quiz_id, user_id: user_id).count
    if existing_count >= quiz.attempts_allowed
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
