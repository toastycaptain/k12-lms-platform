# frozen_string_literal: true

class IbProgrammeSettingPolicy < IbSchoolScopedPolicy
  def replay?
    privileged_user?
  end
end
