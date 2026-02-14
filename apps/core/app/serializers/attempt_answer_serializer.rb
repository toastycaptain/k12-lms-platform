class AttemptAnswerSerializer < ActiveModel::Serializer
  attributes :id, :quiz_attempt_id, :question_id, :answer, :is_correct,
             :points_awarded, :graded_at, :feedback, :created_at, :updated_at
end
