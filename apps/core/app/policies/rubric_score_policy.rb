class RubricScorePolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
