class TenantExportPolicy < ApplicationPolicy
  def export?
    user.has_role?(:admin)
  end

  def export_status?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
