class AuditLogPolicy < ApplicationPolicy
  def index?
    privileged_user?
  end

  def show?
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
