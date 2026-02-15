class DataRetentionPolicy < ApplicationRecord
  include TenantScoped

  VALID_ACTIONS = %w[archive delete anonymize].freeze
  VALID_ENTITY_TYPES = %w[AuditLog AiInvocation SyncLog SyncRun QuizAttempt Submission].freeze

  belongs_to :created_by, class_name: "User"

  validates :name, presence: true
  validates :entity_type, presence: true, inclusion: { in: VALID_ENTITY_TYPES }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :retention_days, presence: true, numericality: { greater_than: 0 }
  validates :enabled, inclusion: { in: [ true, false ] }
end
