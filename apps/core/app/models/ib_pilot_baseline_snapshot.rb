class IbPilotBaselineSnapshot < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[captured refreshed archived].freeze

  belongs_to :school, optional: true
  belongs_to :ib_pilot_profile
  belongs_to :captured_by, class_name: "User", optional: true

  validates :status, inclusion: { in: STATUS_TYPES }
  validates :captured_at, presence: true

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.metric_payload = {} unless metric_payload.is_a?(Hash)
    self.benchmark_payload = {} unless benchmark_payload.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
