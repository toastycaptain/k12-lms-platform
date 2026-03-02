class SchoolSerializer < ActiveModel::Serializer
  attributes :id, :name, :address, :timezone, :curriculum_profile_key, :tenant_id, :created_at, :updated_at
end
