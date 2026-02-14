class SyncLogSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :sync_run_id, :level, :message,
    :entity_type, :entity_id, :external_id, :metadata,
    :created_at, :updated_at
end
