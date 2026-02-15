class AiProviderConfigPolicy < ApplicationPolicy
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
      if user.has_role?(:admin)
        scope.all
      else
        raise Pundit::NotAuthorizedError
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
