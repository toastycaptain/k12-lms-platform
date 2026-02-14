class IntegrationConfigSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :provider, :status, :settings, :created_by_id,
    :created_at, :updated_at
end
