class CurriculumProfileAssignment < ApplicationRecord
  include TenantScoped

  SCOPE_TYPES = %w[tenant school course academic_year].freeze

  belongs_to :school, optional: true
  belongs_to :course, optional: true
  belongs_to :academic_year, optional: true
  belongs_to :assigned_by, class_name: "User", optional: true

  validates :scope_type, presence: true, inclusion: { in: SCOPE_TYPES }
  validates :profile_key, presence: true
  validate :scope_targets_match_scope_type
  validate :profile_key_must_exist

  scope :active_only, -> { where(active: true) }
  scope :for_scope, ->(scope_type) { where(scope_type: scope_type) }
  scope :latest_first, -> { order(updated_at: :desc, id: :desc) }

  private

  def scope_targets_match_scope_type
    case scope_type
    when "tenant"
      return if school_id.blank? && course_id.blank?
      errors.add(:scope_type, "tenant scope cannot set school_id or course_id")
    when "school"
      errors.add(:school_id, "is required for school scope") if school_id.blank?
      errors.add(:course_id, "must be blank for school scope") if course_id.present?
    when "course"
      errors.add(:course_id, "is required for course scope") if course_id.blank?
    when "academic_year"
      errors.add(:academic_year_id, "is required for academic_year scope") if academic_year_id.blank?
      return if school_id.blank? && course_id.blank?
      errors.add(:scope_type, "academic_year scope cannot set school_id or course_id")
    end
  end

  def profile_key_must_exist
    return if profile_key.blank?
    tenant = Tenant.unscoped.find_by(id: tenant_id)
    version = profile_version.to_s.presence

    exists = if tenant
      CurriculumPackStore.exists?(tenant: tenant, key: profile_key, version: version)
    else
      CurriculumPackStore.system_exists?(profile_key, version)
    end

    return if exists

    errors.add(:profile_key, "is not a recognized curriculum pack")
  end
end
