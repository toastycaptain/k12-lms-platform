class SyncRunSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :integration_config_id, :sync_type, :direction,
    :status, :started_at, :completed_at, :records_processed,
    :records_succeeded, :records_failed, :error_message,
    :triggered_by_id, :created_at, :updated_at
end
