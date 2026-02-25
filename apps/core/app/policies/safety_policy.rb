class SafetyPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end

  def manage?
    user.has_role?(:admin)
  end
end
