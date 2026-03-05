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
    return if CurriculumProfileRegistry.keys.include?(curriculum_profile_key)

    errors.add(:curriculum_profile_key, "is not a recognized curriculum profile")
  end

  def curriculum_profile_version_must_match_key
    return if curriculum_profile_version.blank?
    return if curriculum_profile_key.blank?
    return if CurriculumProfileRegistry.exists?(curriculum_profile_key, curriculum_profile_version)

    errors.add(:curriculum_profile_version, "is not valid for the selected curriculum_profile_key")
  end
end
