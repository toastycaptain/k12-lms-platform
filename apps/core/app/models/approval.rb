class Approval < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[pending approved rejected].freeze

  belongs_to :approvable, polymorphic: true
  belongs_to :requested_by, class_name: "User"
  belongs_to :reviewed_by, class_name: "User", optional: true

  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :approvable_type, presence: true
  validates :approvable_id, presence: true
  validate :no_duplicate_pending, on: :create

  scope :pending, -> { where(status: "pending") }

  def approve!(reviewer:)
    raise ActiveRecord::RecordInvalid, self unless status == "pending"

    update!(status: "approved", reviewed_by: reviewer, reviewed_at: Time.current)
  end

  def reject!(reviewer:, comments:)
    raise ActiveRecord::RecordInvalid, self unless status == "pending"

    update!(status: "rejected", reviewed_by: reviewer, reviewed_at: Time.current, comments: comments)
  end

  private

  def no_duplicate_pending
    if Approval.where(approvable: approvable, status: "pending").exists?
      errors.add(:base, "A pending approval already exists for this item")
    end
  end
end
