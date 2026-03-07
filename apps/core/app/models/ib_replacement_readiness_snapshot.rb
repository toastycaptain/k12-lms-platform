class IbReplacementReadinessSnapshot < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft green yellow red archived].freeze

  belongs_to :school, optional: true
  belongs_to :ib_pilot_profile, optional: true
  belongs_to :captured_by, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :generated_at, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.readiness_summary = {} unless readiness_summary.is_a?(Hash)
    self.gap_summary = {} unless gap_summary.is_a?(Hash)
    self.export_payload = {} unless export_payload.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
