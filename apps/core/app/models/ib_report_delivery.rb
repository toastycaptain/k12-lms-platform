class IbReportDelivery < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[queued delivered read acknowledged failed].freeze
  CHANNEL_TYPES = %w[web pdf email conference_packet].freeze

  belongs_to :school, optional: true
  belongs_to :ib_report
  belongs_to :ib_report_version, optional: true
  belongs_to :recipient, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :channel, inclusion: { in: CHANNEL_TYPES }
  validates :audience_role, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.metadata = {} unless metadata.is_a?(Hash)
    self.failure_payload = {} unless failure_payload.is_a?(Hash)
  end
end
