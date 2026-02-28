class Goal < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active completed archived].freeze

  belongs_to :student, class_name: "User"

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :progress_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validate :student_in_tenant

  scope :active, -> { where(status: "active") }

  private

  def student_in_tenant
    return if student_id.blank?
    return if student&.tenant_id == tenant_id

    errors.add(:student_id, "must belong to the same tenant")
  end
end
