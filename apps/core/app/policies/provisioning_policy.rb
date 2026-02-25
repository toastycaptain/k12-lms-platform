class ProvisioningPolicy < ApplicationPolicy
  def manage?
    user.has_role?(:admin) || user.district_admin?
  end
end
