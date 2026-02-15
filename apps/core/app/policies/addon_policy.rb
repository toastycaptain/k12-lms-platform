class AddonPolicy < ApplicationPolicy
  def unit_plans?
    user.has_role?(:teacher) || user.has_role?(:admin)
  end

  def lessons?
    unit_plans?
  end

  def attach?
    unit_plans?
  end

  def me?
    unit_plans?
  end

  def standards?
    unit_plans?
  end

  def templates?
    unit_plans?
  end

  def ai_generate?
    unit_plans?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
