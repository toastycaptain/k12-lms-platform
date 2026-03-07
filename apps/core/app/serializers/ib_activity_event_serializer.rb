class IbActivityEventSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :user_id, :event_name, :event_family, :surface,
    :programme, :route_id, :entity_ref, :document_type, :session_key, :dedupe_key,
    :metadata, :occurred_at, :created_at, :updated_at
end
