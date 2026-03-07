# frozen_string_literal: true

class IbCommunicationPreferencePolicy < IbSchoolScopedPolicy
  def show?
    privileged_user? || ownerish?
  end

  def create?
    privileged_user? || ownerish?
  end

  def update?
    privileged_user? || ownerish?
  end
end
