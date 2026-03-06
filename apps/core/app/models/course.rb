class Course < ApplicationRecord
  include TenantScoped

  belongs_to :academic_year
  belongs_to :school, optional: true
  has_many :sections, dependent: :destroy
  has_many :enrollments, through: :sections
  has_many :course_modules, dependent: :destroy
  has_many :assignments, dependent: :destroy
  has_many :grade_categories, dependent: :destroy
  has_many :discussions, dependent: :destroy
  has_many :announcements, dependent: :destroy
  has_many :message_threads, dependent: :nullify
  has_many :quizzes, dependent: :destroy
  has_many :curriculum_profile_assignments, dependent: :nullify
  has_one :curriculum_course_mapping_issue, dependent: :destroy
  has_one_attached :gradebook_export

  validates :name, presence: true
  validate :school_must_belong_to_tenant
  validate :curriculum_profile_override_must_exist

  private

  def school_must_belong_to_tenant
    return if school.blank? || school.tenant_id == tenant_id

    errors.add(:school_id, "must belong to the current tenant")
  end

  def curriculum_profile_override_must_exist
    override_key = settings&.dig("curriculum_profile_key")
    override_version = settings&.dig("curriculum_profile_version")
    return if override_key.blank?

    tenant = Tenant.unscoped.find_by(id: tenant_id)
    return if tenant && CurriculumPackStore.exists?(tenant: tenant, key: override_key, version: override_version)

    errors.add(:settings, "contains an unknown curriculum_profile_key/curriculum_profile_version")
  end
end
