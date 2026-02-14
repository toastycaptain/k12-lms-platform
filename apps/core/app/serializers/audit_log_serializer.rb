class AuditLogSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :user_id, :action, :auditable_type, :auditable_id,
    :changes_data, :metadata, :ip_address, :user_agent, :created_at
end
