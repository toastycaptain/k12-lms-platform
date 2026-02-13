class Submission < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft submitted graded returned].freeze

  belongs_to :assignment
  belongs_to :user
  belongs_to :graded_by, class_name: "User", optional: true
  has_one_attached :attachment

  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :user_id, uniqueness: { scope: :assignment_id, message: "already has a submission for this assignment" }
  validate :grade_within_points_possible, if: -> { grade.present? }

  def submit!
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
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
