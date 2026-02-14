class QuizAttemptSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :quiz_id, :user_id, :attempt_number, :status,
             :score, :percentage, :started_at, :submitted_at, :time_spent_seconds,
             :created_at, :updated_at
end
