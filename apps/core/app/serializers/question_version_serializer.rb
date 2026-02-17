class QuestionVersionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :question_id, :version_number, :question_type, :content, :choices,
    :correct_answer, :explanation, :points, :metadata, :status, :created_by_id, :created_at, :updated_at
end
