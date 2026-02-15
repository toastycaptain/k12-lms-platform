class DataRetentionPolicySerializer < ActiveModel::Serializer
  attributes :id, :name, :entity_type, :action, :retention_days, :enabled,
             :settings, :tenant_id, :created_by_id, :created_at, :updated_at
end
