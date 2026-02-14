class UnitPlanSerializer < ActiveModel::Serializer
  attributes :id, :title, :status, :course_id, :created_by_id, :current_version_id, :created_at, :updated_at
end
