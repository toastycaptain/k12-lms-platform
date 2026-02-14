class AiTaskPolicyPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:teacher) || user.has_role?(:curriculum_lead)
  end

  def create?
    user.has_role?(:admin)
  end

  def update?
    user.has_role?(:admin)
  end

  def destroy?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        user_roles = user.roles.pluck(:name)
        scope.where(enabled: true).where(
          "EXISTS (SELECT 1 FROM jsonb_array_elements_text(allowed_roles) AS role WHERE role IN (?))",
          user_roles
        )
      end
    end
  end
end
