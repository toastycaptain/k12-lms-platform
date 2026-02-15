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
  end
end
