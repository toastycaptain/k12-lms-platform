class PermissionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :role_id, :resource, :action, :granted, :created_at, :updated_at
end
