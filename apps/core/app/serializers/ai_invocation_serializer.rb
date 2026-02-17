class AiInvocationSerializer < ActiveModel::Serializer
  attributes :id, :ai_provider_config_id, :ai_task_policy_id, :ai_template_id,
             :user_id, :provider_name, :model, :task_type, :status, :safe_context,
             :input_hash, :prompt_tokens, :completion_tokens, :total_tokens,
             :duration_ms, :started_at, :completed_at, :error_message,
             :tenant_id, :created_at, :updated_at

  def safe_context
    return {} if object.context.blank?

    safe = object.context.except("prompt", "messages", "system_prompt")
    safe["has_prompt"] = object.context.key?("prompt") || object.context.key?("messages")
    safe
  end
end
