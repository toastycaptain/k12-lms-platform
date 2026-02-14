class SyncRunPolicy < ApplicationPolicy
  def index?
    privileged_user? || user.has_role?(:teacher)
  end

  def show?
    privileged_user? || record.triggered_by_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?
      return scope.where(triggered_by: user) if user.has_role?(:teacher)

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
