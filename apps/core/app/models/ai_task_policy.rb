class AiTaskPolicy < ApplicationRecord
  include TenantScoped

  belongs_to :ai_provider_config
  belongs_to :created_by, class_name: "User"

  has_many :ai_invocations, dependent: :nullify

  validates :task_type, presence: true
  validates :task_type, uniqueness: { scope: :tenant_id }
  validates :enabled, inclusion: { in: [ true, false ] }

  def model_name
    model_override.presence || ai_provider_config.default_model
  end
end
