# frozen_string_literal: true

class IbReportPolicy < IbSchoolScopedPolicy
  def show?
    return false unless same_school_or_unscoped?
    return privileged_user? || user.has_role?(:teacher) || user.has_role?(:curriculum_lead) if professional_audience?
    return true if user.has_role?(:guardian) && record.audience.in?(%w[guardian conference])
    return true if user.has_role?(:student) && record.audience.in?(%w[student conference])
    return true if delivered_to_current_user?

    accessible_for_ib?
  end

  def create?
    manageable_for_ib?
  end

  def update?
    manageable_for_ib?
  end

  private

  def professional_audience?
    return true if record.is_a?(Class)

    record.audience.in?(%w[internal teacher coordinator])
  end

  def delivered_to_current_user?
    return false if record.is_a?(Class)

    IbDeliveryReceipt.exists?(
      tenant_id: user.tenant_id,
      school_id: record.school_id,
      user_id: user.id,
      deliverable_type: "IbReport",
      deliverable_id: record.id
    )
  end
end
