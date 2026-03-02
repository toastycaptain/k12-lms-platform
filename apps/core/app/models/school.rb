class School < ApplicationRecord
  include TenantScoped

  has_many :courses, dependent: :nullify

  validates :name, presence: true
  validates :timezone, presence: true
  validate :curriculum_profile_key_must_exist

  private

  def curriculum_profile_key_must_exist
    return if curriculum_profile_key.blank?
    return if CurriculumProfileRegistry.keys.include?(curriculum_profile_key)

    errors.add(:curriculum_profile_key, "is not a recognized curriculum profile")
  end
end
