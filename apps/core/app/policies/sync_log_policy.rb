class SyncLogPolicy < ApplicationPolicy
  def index?
    privileged_user? || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?
      return scope.joins(:sync_run).where(sync_runs: { triggered_by_id: user.id }) if user.has_role?(:teacher)

      scope.none
    end

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
    end
  end

  private

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end
end
