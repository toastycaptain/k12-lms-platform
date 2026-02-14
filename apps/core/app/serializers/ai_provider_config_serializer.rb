class AiProviderConfigSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :provider_name, :display_name, :status,
    :default_model, :available_models, :settings, :created_by_id,
    :created_at, :updated_at
end
