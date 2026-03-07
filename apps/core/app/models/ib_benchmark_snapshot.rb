class IbBenchmarkSnapshot < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[baseline current regression improved archived].freeze
  ROLE_TYPES = %w[teacher specialist coordinator student guardian admin].freeze

  belongs_to :school, optional: true
  belongs_to :ib_pilot_profile, optional: true
  belongs_to :captured_by, class_name: "User", optional: true

  validates :benchmark_version, :workflow_family, :captured_at, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :role_scope, inclusion: { in: ROLE_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.metrics = {} unless metrics.is_a?(Hash)
    self.thresholds = {} unless thresholds.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
