class SyncLogPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      elsif user.has_role?(:teacher)
        scope.joins(:sync_run).where(sync_runs: { triggered_by_id: user.id })
      else
        scope.none
      end
    end
  end
end
