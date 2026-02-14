class QuestionBankSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :created_by_id, :title, :description, :subject,
    :grade_level, :status, :created_at, :updated_at
end
