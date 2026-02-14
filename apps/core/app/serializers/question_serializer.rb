class QuestionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :question_bank_id, :created_by_id, :question_type,
    :prompt, :choices, :points, :position,
    :status, :created_at, :updated_at

  attribute :correct_answer, if: :privileged_user?
  attribute :explanation, if: :privileged_user?

  def privileged_user?
    user = scope
    return false unless user

    user.has_role?(:admin) || user.has_role?(:teacher) || user.has_role?(:curriculum_lead)
  end
end
