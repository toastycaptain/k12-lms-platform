class AiInvocation < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[pending completed failed].freeze

  belongs_to :ai_provider_config
  belongs_to :ai_task_policy, optional: true
  belongs_to :ai_template, optional: true
  belongs_to :user

  validates :provider_name, presence: true
  validates :model, presence: true
  validates :task_type, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
end
