# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def show?
    user.has_role?(:admin) || record.id == user.id
  end

  def create?
    user.has_role?(:admin)
  end

  def update?
    user.has_role?(:admin) || record.id == user.id
  end

  def destroy?
    user.has_role?(:admin) && record.id != user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:curriculum_lead)
        scope.all
      else
        scope.where(id: user.id)
      end
    end
  end
end
