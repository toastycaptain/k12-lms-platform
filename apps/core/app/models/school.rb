class School < ApplicationRecord
  include TenantScoped

  has_many :courses, dependent: :nullify
  has_many :curriculum_profile_assignments, dependent: :nullify

  validates :name, presence: true
  validates :timezone, presence: true
  validate :curriculum_profile_key_must_exist
  validate :curriculum_profile_version_must_match_key

  private

  def curriculum_profile_key_must_exist
    return if curriculum_profile_key.blank?

    tenant = Tenant.unscoped.find_by(id: tenant_id)
    return if tenant && CurriculumPackStore.exists?(tenant: tenant, key: curriculum_profile_key)

    errors.add(:curriculum_profile_key, "is not a recognized curriculum pack")
  end

  def curriculum_profile_version_must_match_key
    return if curriculum_profile_version.blank?
    return if curriculum_profile_key.blank?

    tenant = Tenant.unscoped.find_by(id: tenant_id)
    return if tenant && CurriculumPackStore.exists?(tenant: tenant, key: curriculum_profile_key, version: curriculum_profile_version)

    errors.add(:curriculum_profile_version, "is not valid for the selected curriculum_profile_key")
  end
end
