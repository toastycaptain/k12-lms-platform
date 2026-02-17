class DistrictSerializer < ActiveModel::Serializer
  attributes :id, :name, :slug, :settings, :created_at, :updated_at
end
