class AttemptAnswerPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    record.quiz_attempt.user_id == user.id && record.quiz_attempt.status == "in_progress"
  end

  def grade?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:teacher)
        scope.all
      else
        scope.joins(:quiz_attempt).where(quiz_attempts: { user_id: user.id })
      end
    end
  end
end
