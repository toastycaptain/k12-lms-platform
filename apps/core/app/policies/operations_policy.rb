class OperationsPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end
end
