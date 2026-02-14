class QuestionSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :question_bank_id, :created_by_id, :question_type,
    :prompt, :choices, :points, :position,
    :status, :created_at, :updated_at

  attribute :correct_answer, if: :show_answer?
  attribute :explanation, if: :show_answer?

  def show_answer?
    return true unless scope
    scope.has_role?(:admin) || scope.has_role?(:teacher) || scope.has_role?(:curriculum_lead)
  end
end
