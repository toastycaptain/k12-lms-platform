class StandardSerializer < ActiveModel::Serializer
  attributes :id, :code, :description, :grade_band, :standard_framework_id, :parent_id, :created_at, :updated_at
end
