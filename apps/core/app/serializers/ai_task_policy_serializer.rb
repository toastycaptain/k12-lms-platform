class AiTaskPolicySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :task_type, :allowed_roles, :ai_provider_config_id,
    :model_override, :max_tokens_limit, :temperature_limit, :requires_approval,
    :enabled, :settings, :created_by_id, :created_at, :updated_at
end
