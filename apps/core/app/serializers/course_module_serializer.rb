class CourseModuleSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :title, :description, :position, :status, :unlock_at, :created_at, :updated_at
end
