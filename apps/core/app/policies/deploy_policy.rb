class DeployPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end
end
