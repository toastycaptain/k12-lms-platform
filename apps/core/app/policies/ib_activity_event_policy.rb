# frozen_string_literal: true

class IbActivityEventPolicy < IbSchoolScopedPolicy
  def create?
    accessible_for_ib?
  end

  def update?
    privileged_user?
  end
end
