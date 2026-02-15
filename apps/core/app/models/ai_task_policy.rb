class AiTaskPolicy < ApplicationRecord
  include TenantScoped

  VALID_TASK_TYPES = %w[lesson_plan unit_plan differentiation assessment rewrite].freeze

  belongs_to :ai_provider_config
  belongs_to :created_by, class_name: "User"
  has_many :ai_invocations, dependent: :nullify

  validates :task_type, presence: true, inclusion: { in: VALID_TASK_TYPES }
  validates :task_type, uniqueness: { scope: :tenant_id }
  validates :max_tokens_limit, numericality: { greater_than: 0 }, allow_nil: true
  validates :temperature_limit, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 2 }, allow_nil: true

  def allowed_for_role?(role_name)
    allowed_roles.blank? || allowed_roles.include?(role_name.to_s)
  end

  def effective_model
    model_override.presence || ai_provider_config.default_model
  end
end
