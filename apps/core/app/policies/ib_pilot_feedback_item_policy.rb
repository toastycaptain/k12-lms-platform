class IbPilotFeedbackItemPolicy < IbSchoolScopedPolicy
  def create?
    accessible_for_ib?
  end

  def update?
    privileged_user? || ownerish? || user.has_role?(:teacher) || user.has_role?(:curriculum_lead)
  end
end
