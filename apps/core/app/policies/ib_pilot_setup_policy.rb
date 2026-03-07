# frozen_string_literal: true

class IbPilotSetupPolicy < IbSchoolScopedPolicy
  def apply_baseline?
    privileged_user?
  end

  def validate_setup?
    manageable_for_ib?
  end

  def activate?
    privileged_user?
  end

  def pause?
    privileged_user?
  end

  def resume?
    privileged_user?
  end

  def retire?
    privileged_user?
  end
end
