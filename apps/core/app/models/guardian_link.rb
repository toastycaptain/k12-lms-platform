class GuardianLink < ApplicationRecord
  include TenantScoped

  VALID_RELATIONSHIPS = %w[parent guardian other].freeze
  VALID_STATUSES = %w[active inactive].freeze

  belongs_to :guardian, class_name: "User"
  belongs_to :student, class_name: "User"

  validates :relationship, presence: true, inclusion: { in: VALID_RELATIONSHIPS }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :student_id, uniqueness: { scope: [ :tenant_id, :guardian_id ] }
  validate :guardian_and_student_must_differ
  validate :linked_users_must_match_tenant

  scope :active, -> { where(status: "active") }

  private

  def guardian_and_student_must_differ
    return if guardian_id.blank? || student_id.blank?
    return unless guardian_id == student_id

    errors.add(:student_id, "must differ from guardian")
  end

  def linked_users_must_match_tenant
    return if tenant_id.blank?

    if guardian&.tenant_id.present? && guardian.tenant_id != tenant_id
      errors.add(:guardian_id, "must belong to the same tenant")
    end

    if student&.tenant_id.present? && student.tenant_id != tenant_id
      errors.add(:student_id, "must belong to the same tenant")
    end
  end
end
