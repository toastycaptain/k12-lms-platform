class LessonPlanSerializer < ActiveModel::Serializer
  attributes :id, :title, :status, :position, :unit_plan_id, :created_by_id,
    :current_version_id, :created_at, :updated_at
end
