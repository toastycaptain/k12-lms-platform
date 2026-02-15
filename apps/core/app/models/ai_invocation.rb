class AiInvocation < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[pending running completed failed].freeze

  belongs_to :user
  belongs_to :ai_provider_config
  belongs_to :ai_task_policy, optional: true
  belongs_to :ai_template, optional: true

  validates :task_type, presence: true
  validates :provider_name, presence: true
  validates :model, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def complete!(tokens:, duration:, response_hash: nil)
    update!(
      status: "completed",
      completed_at: Time.current,
      prompt_tokens: tokens[:prompt],
      completion_tokens: tokens[:completion],
      total_tokens: tokens[:total],
      duration_ms: duration
    )
  end

  def fail!(message)
    update!(status: "failed", error_message: message, completed_at: Time.current)
  end
end
