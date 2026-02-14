class DataRetentionPolicy < ApplicationRecord
  include TenantScoped

  VALID_ENTITY_TYPES = %w[audit_log sync_log ai_invocation].freeze
  VALID_ACTIONS = %w[archive anonymize delete].freeze

  belongs_to :created_by, class_name: "User"

  validates :name, presence: true
  validates :entity_type, presence: true, inclusion: { in: VALID_ENTITY_TYPES }
  validates :retention_days, presence: true, numericality: { greater_than_or_equal_to: 30 }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
end
