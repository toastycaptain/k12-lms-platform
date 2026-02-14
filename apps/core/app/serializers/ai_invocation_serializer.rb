class AiInvocationSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :user_id, :ai_provider_config_id,
    :ai_task_policy_id, :ai_template_id, :task_type, :provider_name,
    :model, :status, :prompt_tokens, :completion_tokens, :total_tokens,
    :duration_ms, :input_hash, :error_message, :context,
    :started_at, :completed_at, :created_at, :updated_at
end
