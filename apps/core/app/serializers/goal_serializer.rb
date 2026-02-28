class GoalSerializer < ActiveModel::Serializer
  attributes :id, :student_id, :title, :description, :status, :target_date, :progress_percent, :created_at, :updated_at
end
