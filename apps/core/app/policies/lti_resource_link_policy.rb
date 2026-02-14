class LtiResourceLinkPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
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
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
