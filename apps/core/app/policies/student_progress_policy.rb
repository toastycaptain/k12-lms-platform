class StudentProgressPolicy < ApplicationPolicy
  def show?
    admin_user? || own_progress? || guardian_linked_student? || teaches_student?
  end

  def course_detail?
    show?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_user?
      return scope.where(id: user.id) if user.has_role?(:student)
      return guardian_scope if user.has_role?(:guardian)
      return teacher_scope if user.has_role?(:teacher)

      scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin) || user.has_role?(:district_admin)
    end

    def guardian_scope
      scope.where(
        id: GuardianLink.active.where(guardian_id: user.id).select(:student_id)
      )
    end

    def teacher_scope
      section_ids = Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
      scope.joins(:enrollments)
           .where(enrollments: { role: "student", section_id: section_ids })
           .distinct
    end
  end

  private

  def admin_user?
    user.has_role?(:admin) || user.has_role?(:district_admin)
  end

  def own_progress?
    user.has_role?(:student) && record.id == user.id
  end

  def guardian_linked_student?
    return false unless user.has_role?(:guardian)

    GuardianLink.active.exists?(guardian_id: user.id, student_id: record.id)
  end

  def teaches_student?
    return false unless user.has_role?(:teacher)

    teacher_section_ids = Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
    Enrollment.exists?(user_id: record.id, role: "student", section_id: teacher_section_ids)
  end
end
