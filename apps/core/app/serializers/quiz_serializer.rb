class QuizSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :course_id, :created_by_id, :title, :description,
    :instructions, :quiz_type, :time_limit_minutes, :attempts_allowed,
    :shuffle_questions, :shuffle_choices, :show_results, :points_possible,
    :due_at, :unlock_at, :lock_at, :status, :created_at, :updated_at
end
