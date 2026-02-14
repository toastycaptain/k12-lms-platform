# frozen_string_literal: true

class UnitPlanPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def update?
    user.has_role?(:admin) || record.created_by_id == user.id
  end

  def destroy?
    user.has_role?(:admin) || record.created_by_id == user.id
  end

  def create_version?
    update?
  end

  def publish?
    user.has_role?(:admin) || record.created_by_id == user.id
  end

  def archive?
    publish?
  end

  def submit_for_approval?
    publish?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
