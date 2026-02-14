class DataRetentionPolicySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :name, :entity_type, :retention_days,
    :action, :enabled, :settings, :created_by_id, :created_at, :updated_at
end
