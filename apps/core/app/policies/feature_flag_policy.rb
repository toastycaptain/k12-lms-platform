class FeatureFlagPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  def manage?
    user.has_role?(:admin)
  end

  def update?
    manage?
  end

  def destroy?
    manage?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.has_role?(:admin) ? scope.all : scope.none
    end
  end
end
