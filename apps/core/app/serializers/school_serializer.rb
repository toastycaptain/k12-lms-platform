class SchoolSerializer < ActiveModel::Serializer
  attributes :id, :name, :address, :timezone, :tenant_id, :created_at, :updated_at
end
