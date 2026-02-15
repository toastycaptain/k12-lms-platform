class AiInvocationSerializer < ActiveModel::Serializer
  attributes :id, :ai_provider_config_id, :ai_task_policy_id, :ai_template_id,
             :user_id, :provider_name, :model, :task_type, :status, :context,
             :input_hash, :prompt_tokens, :completion_tokens, :total_tokens,
             :duration_ms, :started_at, :completed_at, :error_message,
             :tenant_id, :created_at, :updated_at
end
