class CourseModulePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def update?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def destroy?
    user.has_role?(:admin)
  end

  def publish?
    create?
  end

  def archive?
    create?
  end

  def reorder_items?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
