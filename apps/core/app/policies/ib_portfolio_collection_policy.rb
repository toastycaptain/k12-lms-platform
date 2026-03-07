# frozen_string_literal: true

class IbPortfolioCollectionPolicy < IbSchoolScopedPolicy
  def show?
    privileged_user? || record.student_id == user.id || ownerish? || guardian_for_student?
  end

  def update?
    privileged_user? || record.student_id == user.id || ownerish?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.where(tenant_id: user.tenant_id)
      return scoped if privileged_user?
      return scoped.where(student_id: user.id) if user.has_role?(:student)
      return scoped.where(student_id: GuardianLink.active.where(guardian_id: user.id).select(:student_id)) if user.has_role?(:guardian)

      scoped.where(created_by_id: user.id)
    end
  end

  private

  def guardian_for_student?
    GuardianLink.active.where(guardian_id: user.id, student_id: record.student_id).exists?
  end
end
