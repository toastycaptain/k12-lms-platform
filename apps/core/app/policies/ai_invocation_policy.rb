class AiInvocationPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin_user? || record.user_id == user.id
  end

  def create?
    true
  end

  def update?
    admin_user? || record.user_id == user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
