class QuizItemSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :quiz_id, :question_id, :position, :points,
    :created_at, :updated_at
end
