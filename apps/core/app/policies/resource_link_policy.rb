# frozen_string_literal: true

class ResourceLinkPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def destroy?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
