class IntegrationConfig < ApplicationRecord
  include TenantScoped

  # encrypts :settings — requires ACTIVE_RECORD_ENCRYPTION_* env vars to be configured
  # Re-enable once encryption keys are provisioned in production

  VALID_PROVIDERS = %w[google_classroom google_workspace oneroster saml].freeze
  VALID_STATUSES = %w[inactive active error].freeze

  belongs_to :created_by, class_name: "User"

  has_many :sync_mappings, dependent: :destroy
  has_many :sync_runs, dependent: :destroy

  validates :provider, presence: true, inclusion: { in: VALID_PROVIDERS }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :provider, uniqueness: { scope: :tenant_id }

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
end
