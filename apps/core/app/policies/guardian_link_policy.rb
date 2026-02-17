class GuardianLinkPolicy < ApplicationPolicy
  def index?
    admin_user? || guardian_user?
  end

  def show?
    admin_user? || owns_link?
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
      return scope.all if admin_user?
      return scope.where(guardian_id: user.id) if guardian_user?

      scope.none
    end

    private

    def admin_user?
      user&.has_role?(:admin)
    end

    def guardian_user?
      user&.has_role?(:guardian)
    end
  end

  private

  def admin_user?
    user&.has_role?(:admin)
  end

  def guardian_user?
    user&.has_role?(:guardian)
  end

  def owns_link?
    record.guardian_id == user.id
  end
end
