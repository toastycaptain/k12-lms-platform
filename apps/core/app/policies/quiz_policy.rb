class QuizPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def update?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def destroy?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def publish?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def close?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def results?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
