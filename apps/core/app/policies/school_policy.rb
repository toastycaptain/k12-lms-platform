class SchoolPolicy < ApplicationPolicy
  def index?
    privileged_user?
  end

  def show?
    privileged_user?
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
      privileged_user? ? scope.all : scope.none
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
