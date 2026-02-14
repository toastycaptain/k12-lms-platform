class DataRetentionPolicyPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  def show?
    user.has_role?(:admin)
  end

  def create?
    user.has_role?(:admin)
  end

  def update?
    user.has_role?(:admin)
  end

  def destroy?
    user.has_role?(:admin)
  end

  def run?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
