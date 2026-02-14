class AiPolicy < ApplicationPolicy
  def health?
    user.has_role?(:admin)
  end
end
