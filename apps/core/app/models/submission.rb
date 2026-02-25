class Submission < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  VALID_STATUSES = %w[draft submitted graded returned missing].freeze

  belongs_to :assignment, counter_cache: true
  belongs_to :user
  belongs_to :graded_by, class_name: "User", optional: true
  has_many :rubric_scores, dependent: :destroy
  has_one_attached :attachment
  validates_attachment :attachment,
    content_types: AttachmentValidatable::ALLOWED_SUBMISSION_TYPES,
    max_size: 50.megabytes

  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :user_id, uniqueness: { scope: :assignment_id, message: "already has a submission for this assignment" }
  validate :grade_within_points_possible, if: -> { grade.present? }

  scope :missing, -> { where(status: "missing") }

  def submit!
    raise ActiveRecord::RecordInvalid, self unless %w[draft missing].include?(status)
    raise ActiveRecord::RecordInvalid, self unless assignment.status == "published"
    raise ActiveRecord::RecordInvalid, self if assignment.lock_at.present? && Time.current > assignment.lock_at

    update!(status: "submitted", submitted_at: Time.current)
  end

  private

  def grade_within_points_possible
    return unless assignment&.points_possible.present?

    if grade > assignment.points_possible
      errors.add(:grade, "cannot exceed assignment points possible")
    end
  end
end
