class QuizAttemptPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:teacher) || record.user_id == user.id
  end

  def create?
    user.has_role?(:student) || user.has_role?(:teacher)
  end

  def submit?
    record.user_id == user.id
  end

  def grade_all?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:teacher)
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end
end
