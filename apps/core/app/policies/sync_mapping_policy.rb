class SyncMappingPolicy < ApplicationPolicy
  def index?
    admin_user?
  end

  def show?
    admin_user?
  end

  def destroy?
    admin_user?
  end

  def sync_roster?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      user.has_role?(:admin) ? scope.all : scope.none
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
