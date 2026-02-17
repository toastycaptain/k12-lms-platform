class QuestionVersionPolicy < ApplicationPolicy
  def index?
    content_creator?
  end

  def show?
    content_creator?
  end

  def create?
    return true if admin_or_curriculum_lead?

    teacher_user? && teacher_owns_question_bank?
  end

  def update?
    create?
  end

  def destroy?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_or_curriculum_lead?

      if teacher_user?
        scope.joins(question: :question_bank).where(
          "questions.created_by_id = :user_id OR question_banks.created_by_id = :user_id",
          user_id: user.id
        )
      else
        scope.none
      end
    end

    private

    def admin_or_curriculum_lead?
      user&.has_role?(:admin) || user&.has_role?(:curriculum_lead)
    end

    def teacher_user?
      user&.has_role?(:teacher)
    end
  end

  private

  def admin_or_curriculum_lead?
    user&.has_role?(:admin) || user&.has_role?(:curriculum_lead)
  end

  def teacher_user?
    user&.has_role?(:teacher)
  end

  def content_creator?
    return true if admin_or_curriculum_lead?

    teacher_user? && teacher_owns_question_bank?
  end

  def teacher_owns_question_bank?
    question = record.question
    return false if question.blank?

    question.created_by_id == user.id || question.question_bank.created_by_id == user.id
  end
end
