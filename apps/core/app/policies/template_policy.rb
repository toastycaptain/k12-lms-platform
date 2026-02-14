# frozen_string_literal: true

class TemplatePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
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

  def create_version?
    update?
  end

  def publish?
    update?
  end

  def archive?
    update?
  end

  def create_unit?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
