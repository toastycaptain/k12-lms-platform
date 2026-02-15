class LtiRegistrationPolicy < ApplicationPolicy
  def index?
    admin_user?
  end

  def show?
    admin_user?
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

  def activate?
    admin_user?
  end

  def deactivate?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      admin_user? ? scope.all : scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin)
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
