class AiTemplatePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def update?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def destroy?
    user.has_role?(:admin)
  end

  def activate?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def archive?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
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
end
