class IbReportVersion < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft in_review signed_off rendered failed].freeze

  belongs_to :ib_report
  belongs_to :signed_off_by, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :template_key, :version_number, presence: true
  validates :version_number, uniqueness: { scope: :ib_report_id }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.content_payload = {} unless content_payload.is_a?(Hash)
    self.render_payload = {} unless render_payload.is_a?(Hash)
    self.proofing_summary = {} unless proofing_summary.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
