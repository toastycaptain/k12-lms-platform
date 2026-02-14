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

  def start!
    update!(started_at: Time.current, status: "running")
  end

  def complete!(usage = {})
    update!(
      completed_at: Time.current,
      status: "completed",
      prompt_tokens: usage[:prompt_tokens],
      completion_tokens: usage[:completion_tokens],
      total_tokens: usage[:total_tokens],
      duration_ms: started_at ? ((Time.current - started_at) * 1000).to_i : nil
    )
  end

  def fail!(message)
    update!(
      completed_at: Time.current,
      status: "failed",
      error_message: message,
      duration_ms: started_at ? ((Time.current - started_at) * 1000).to_i : nil
    )
  end
end
