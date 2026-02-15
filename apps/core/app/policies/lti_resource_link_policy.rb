class LtiResourceLinkPolicy < ApplicationPolicy
  def index?
    admin_user? || teacher_user?
  end

  def show?
    admin_user? || teacher_user?
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
      return scope.all if admin_user? || teacher_user?

      scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin)
    end

    def teacher_user?
      user.has_role?(:teacher)
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end

  def teacher_user?
    user.has_role?(:teacher)
  end
end
