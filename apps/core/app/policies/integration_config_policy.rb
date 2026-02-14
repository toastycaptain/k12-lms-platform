class IntegrationConfigPolicy < ApplicationPolicy
  def index?
    privileged_user?
  end

  def show?
    privileged_user?
  end

  def create?
    privileged_user?
  end

  def update?
    privileged_user?
  end

  def destroy?
    privileged_user?
  end

  def activate?
    privileged_user?
  end

  def deactivate?
    privileged_user?
  end

  def sync_courses?
    privileged_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      privileged_user? ? scope.all : scope.none
    end

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
    end
  end

  private

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end
end
