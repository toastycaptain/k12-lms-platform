class IbSearchProfile < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft active archived].freeze

  belongs_to :school, optional: true
  belongs_to :created_by, class_name: "User", optional: true

  validates :key, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
  validates :latency_budget_ms, numericality: { greater_than: 0 }

  before_validation :normalize_payloads

  private

  def normalize_payloads
    self.facet_config = {} unless facet_config.is_a?(Hash)
    self.ranking_rules = {} unless ranking_rules.is_a?(Hash)
    self.scope_rules = {} unless scope_rules.is_a?(Hash)
    self.metadata = {} unless metadata.is_a?(Hash)
  end
end
