# frozen_string_literal: true

class EnrollmentPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_enrollment? || teaches_section?(record.section_id)
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def update?
    user.has_role?(:admin)
  end

  def destroy?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      return teacher_scope if user.has_role?(:teacher)

      scope.where(user_id: user.id)
    end

    private

    def teacher_scope
      scope.where(user_id: user.id)
        .or(scope.where(section_id: taught_section_ids))
        .distinct
    end

    def taught_section_ids
      Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
    end
  end

  private

  def owns_enrollment?
    record.user_id == user.id
  end

  def teaches_section?(section_id)
    Enrollment.exists?(user_id: user.id, section_id: section_id, role: "teacher")
  end
end
