class SyncMappingPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def destroy?
    user.has_role?(:admin)
  end

  def sync_roster?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:teacher)
        scope.all
      else
        scope.none
      end
    end
  end
end
