class GoalPolicy < ApplicationPolicy
  def index?
    student_role? || teacher_role? || guardian_role? || admin_role?
  end

  def show?
    admin_role? || own_goal? || teacher_manages_student? || guardian_linked_student?
  end

  def create?
    own_goal? && student_role?
  end

  def update?
    own_goal? && student_role?
  end

  def destroy?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_role?
      return scope.where(student_id: user.id) if student_role?
      return scope.where(student_id: guardian_student_ids) if guardian_role?
      return scope.where(student_id: teacher_student_ids) if teacher_role?

      scope.none
    end

    private

    def admin_role?
      user.has_role?(:admin) || user.has_role?(:district_admin)
    end

    def student_role?
      user.has_role?(:student)
    end

    def guardian_role?
      user.has_role?(:guardian)
    end

    def teacher_role?
      user.has_role?(:teacher)
    end

    def guardian_student_ids
      GuardianLink.active.where(guardian_id: user.id).select(:student_id)
    end

    def teacher_student_ids
      teacher_section_ids = Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
      Enrollment.where(role: "student", section_id: teacher_section_ids).select(:user_id)
    end
  end

  private

  def admin_role?
    user.has_role?(:admin) || user.has_role?(:district_admin)
  end

  def student_role?
    user.has_role?(:student)
  end

  def teacher_role?
    user.has_role?(:teacher)
  end

  def guardian_role?
    user.has_role?(:guardian)
  end

  def own_goal?
    record.student_id == user.id
  end

  def guardian_linked_student?
    return false unless guardian_role?

    GuardianLink.active.exists?(guardian_id: user.id, student_id: record.student_id)
  end

  def teacher_manages_student?
    return false unless teacher_role?

    teacher_section_ids = Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
    Enrollment.exists?(user_id: record.student_id, role: "student", section_id: teacher_section_ids)
  end
end
