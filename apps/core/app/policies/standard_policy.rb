# frozen_string_literal: true

class StandardPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def tree?
    true
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

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
