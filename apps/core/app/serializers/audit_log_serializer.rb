class AuditLogSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :actor_id, :event_type, :auditable_type, :auditable_id,
             :request_id, :ip_address, :user_agent, :metadata, :created_at
end
