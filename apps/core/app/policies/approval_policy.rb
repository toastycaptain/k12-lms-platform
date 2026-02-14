# frozen_string_literal: true

class ApprovalPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def approve?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def reject?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
