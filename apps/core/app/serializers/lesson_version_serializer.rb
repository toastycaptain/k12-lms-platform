class LessonVersionSerializer < ActiveModel::Serializer
  attributes :id, :lesson_plan_id, :version_number, :title, :objectives,
    :activities, :materials, :duration_minutes, :created_at, :updated_at
end
