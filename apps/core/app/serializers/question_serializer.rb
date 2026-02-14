class QuestionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :question_bank_id, :created_by_id, :question_type,
    :prompt, :choices, :correct_answer, :points, :explanation, :position,
    :status, :created_at, :updated_at
end
