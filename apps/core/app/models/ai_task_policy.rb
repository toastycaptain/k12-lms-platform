class AiTaskPolicy < ApplicationRecord
  include TenantScoped

  VALID_TASK_TYPES = %w[lesson_generation unit_generation differentiation assessment_generation rewrite].freeze

  belongs_to :ai_provider_config
  belongs_to :created_by, class_name: "User"

  validates :task_type, presence: true, inclusion: { in: VALID_TASK_TYPES }
  validates :task_type, uniqueness: { scope: :tenant_id }

  def allowed_for?(user)
    enabled? && (allowed_roles & user.roles.pluck(:name)).any?
  end

  def effective_model
    model_override.presence || ai_provider_config.default_model
  end
end
