class GradeCategorySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :course_id, :name, :weight_percentage, :created_at, :updated_at
end
