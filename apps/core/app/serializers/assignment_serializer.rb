class AssignmentSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :created_by_id, :rubric_id, :title, :description,
    :instructions, :assignment_type, :points_possible, :due_at, :unlock_at, :lock_at,
    :submission_types, :allow_late_submission, :status, :created_at, :updated_at
end
