class AiTemplatePolicy < ApplicationPolicy
  def index?
    admin_user? || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def show?
    admin_user? || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
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
      if user.has_role?(:admin) || user.has_role?(:curriculum_lead)
        scope.all
      else
        scope.where(status: "active")
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
