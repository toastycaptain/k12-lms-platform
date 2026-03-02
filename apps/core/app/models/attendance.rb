class Attendance < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[present absent tardy excused].freeze

  belongs_to :student, class_name: "User"
  belongs_to :section
  belongs_to :recorded_by, class_name: "User", optional: true

  validates :occurred_on, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :occurred_on, uniqueness: { scope: [ :tenant_id, :student_id, :section_id ] }

  validate :student_in_tenant
  validate :section_in_tenant
  validate :recorded_by_in_tenant

  scope :recent_first, -> { order(occurred_on: :desc, created_at: :desc) }

  private

  def student_in_tenant
    return if student_id.blank?
    return if student&.tenant_id == tenant_id

    errors.add(:student_id, "must belong to the same tenant")
  end

  def section_in_tenant
    return if section_id.blank?
    return if section&.tenant_id == tenant_id

    errors.add(:section_id, "must belong to the same tenant")
  end

  def recorded_by_in_tenant
    return if recorded_by_id.blank?
    return if recorded_by&.tenant_id == tenant_id

    errors.add(:recorded_by_id, "must belong to the same tenant")
  end
end
