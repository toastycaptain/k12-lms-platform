# frozen_string_literal: true

class IbReleaseBaselinePolicy < IbPilotSetupPolicy
  def certify?
    privileged_user?
  end

  def rollback?
    privileged_user?
  end
end
