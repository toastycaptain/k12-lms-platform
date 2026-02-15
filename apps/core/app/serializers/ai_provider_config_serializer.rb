class AiProviderConfigSerializer < ActiveModel::Serializer
  attributes :id, :provider_name, :display_name, :default_model, :available_models,
             :status, :settings, :tenant_id, :created_by_id, :created_at, :updated_at
end
