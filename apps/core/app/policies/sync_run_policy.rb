class SyncRunPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      elsif user.has_role?(:teacher)
        scope.where(triggered_by: user)
      else
        scope.none
      end
    end
  end
end
