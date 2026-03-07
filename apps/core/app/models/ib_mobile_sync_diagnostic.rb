class IbMobileSyncDiagnostic < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[healthy syncing degraded offline conflicted failed].freeze

  belongs_to :school, optional: true
  belongs_to :user, optional: true

  validates :device_class, :workflow_key, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.failure_payload = {} unless failure_payload.is_a?(Hash)
    self.diagnostics = {} unless diagnostics.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
