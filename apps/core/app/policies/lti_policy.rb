class LtiPolicy < ApplicationPolicy
  def login?
    true
  end

  def launch?
    true
  end

  def deep_link?
    user.has_role?(:admin) || user.has_role?(:teacher)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
