class AiTaskPolicySerializer < ActiveModel::Serializer
  attributes :id, :ai_provider_config_id, :task_type, :enabled, :allowed_roles,
             :max_tokens_limit, :temperature_limit, :model_override, :requires_approval,
             :settings, :tenant_id, :created_by_id, :created_at, :updated_at
end
