class SyncMappingSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :integration_config_id, :local_type, :local_id,
    :external_id, :external_type, :metadata, :last_synced_at,
    :created_at, :updated_at
end
