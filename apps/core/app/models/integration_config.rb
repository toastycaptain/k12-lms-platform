class IntegrationConfig < ApplicationRecord
  include TenantScoped

  encrypts :settings

  VALID_PROVIDERS = %w[google_classroom google_workspace oneroster saml].freeze
  VALID_STATUSES = %w[inactive active error].freeze

  ALLOWED_SETTINGS_KEYS = %w[
    base_url client_id client_secret oauth_token oauth_token_secret api_key
    sync_enabled sync_interval_hours roster_sync grade_passback course_sync
    deployment_id auto_provision default_role addon_token service_token
    addon_user_id service_user_id classroom_enabled drive_enabled
    auto_sync_enabled domain
    idp_sso_url idp_cert_fingerprint idp_cert idp_entity_id
    sp_entity_id assertion_consumer_service_url name_identifier_format
  ].freeze

  belongs_to :created_by, class_name: "User"

  has_many :sync_mappings, dependent: :destroy
  has_many :sync_runs, dependent: :destroy

  validates :provider, presence: true, inclusion: { in: VALID_PROVIDERS }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :provider, uniqueness: { scope: :tenant_id }
  validate :settings_keys_whitelisted
  validate :validate_base_url_safety

  def activate!
    unless settings.present? && settings.is_a?(Hash)
      errors.add(:settings, "must be configured before activation")
      raise ActiveRecord::RecordInvalid, self
    end
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end

  private

  def validate_base_url_safety
    url = settings&.dig("base_url")
    return if url.blank?

    validator = SafeUrlValidator.new(attributes: [ :base_url ])
    validator.validate_each(self, :base_url, url)
  end

  def settings_keys_whitelisted
    return if settings.blank?

    unknown_keys = settings.keys - ALLOWED_SETTINGS_KEYS
    if unknown_keys.any?
      errors.add(:settings, "contains unknown keys: #{unknown_keys.join(', ')}")
    end
  end
end
