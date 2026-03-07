class IbIntelligenceMetricDefinition < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft active deprecated archived].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  validates :key, :label, :metric_family, :version, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.source_of_truth = {} unless source_of_truth.is_a?(Hash)
    self.threshold_config = {} unless threshold_config.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
