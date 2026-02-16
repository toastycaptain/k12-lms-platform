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
    normalized_tokens = normalize_tokens(tokens)
    updated_context = (context || {}).dup
    updated_context["response"] = response_hash if response_hash.present?

    update!(
      status: "completed",
      completed_at: Time.current,
      prompt_tokens: normalized_tokens[:prompt],
      completion_tokens: normalized_tokens[:completion],
      total_tokens: normalized_tokens[:total],
      duration_ms: duration,
      context: updated_context
    )
  end

  def fail!(message)
    update!(status: "failed", error_message: message, completed_at: Time.current)
  end

  private

  def normalize_tokens(tokens)
    token_hash = tokens.respond_to?(:to_h) ? tokens.to_h : {}

    {
      prompt: token_hash[:prompt] || token_hash["prompt"] || token_hash[:prompt_tokens] || token_hash["prompt_tokens"],
      completion: token_hash[:completion] || token_hash["completion"] || token_hash[:completion_tokens] || token_hash["completion_tokens"],
      total: token_hash[:total] || token_hash["total"] || token_hash[:total_tokens] || token_hash["total_tokens"]
    }
  end
end
