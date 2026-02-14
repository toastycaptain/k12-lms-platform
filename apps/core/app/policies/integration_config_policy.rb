class IntegrationConfigPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  def show?
    user.has_role?(:admin)
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

  def activate?
    user.has_role?(:admin)
  end

  def deactivate?
    user.has_role?(:admin)
  end

  def sync_courses?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  def test_connection?
    user.has_role?(:admin)
  end

  def sync_orgs?
    user.has_role?(:admin)
  end

  def sync_users?
    user.has_role?(:admin)
  end

  def sync_classes?
    user.has_role?(:admin)
  end

  def sync_enrollments?
    user.has_role?(:admin)
  end

  def import_csv?
    user.has_role?(:admin)
  end

  def import_status?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.none
      end
    end
  end
end
