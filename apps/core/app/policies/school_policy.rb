class SchoolPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    admin_user?
  end

  def update?
    admin_user?
  end

  def destroy?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
