class SyncMapping < ApplicationRecord
  include TenantScoped

  VALID_LOCAL_TYPES = %w[Course Section Enrollment Assignment Submission School AcademicYear Term User].freeze
  VALID_EXTERNAL_TYPES = %w[classroom_course classroom_section classroom_student classroom_coursework
    classroom_submission oneroster_org oneroster_academic_session oneroster_class oneroster_user
    oneroster_enrollment].freeze

  belongs_to :integration_config

  validates :local_type, presence: true, inclusion: { in: VALID_LOCAL_TYPES }
  validates :external_type, presence: true, inclusion: { in: VALID_EXTERNAL_TYPES }
  validates :external_id, presence: true
  validates :local_id, uniqueness: { scope: [ :integration_config_id, :local_type ] }
  validates :external_id, uniqueness: { scope: [ :integration_config_id, :external_type ] }

  scope :for_local, ->(type, id) { where(local_type: type, local_id: id) }
  scope :for_external, ->(type, id) { where(external_type: type, external_id: id) }

  def self.find_local(integration_config, local_type, local_id)
    where(integration_config: integration_config, local_type: local_type, local_id: local_id).first
  end

  def self.find_external(integration_config, external_type, external_id)
    where(integration_config: integration_config, external_type: external_type, external_id: external_id).first
  end
end
