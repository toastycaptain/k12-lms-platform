class SubmissionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin_user? || owns_submission? || teacher_enrolled_in_assignment_course?
  end

  def create?
    user.has_role?(:student) && enrolled_student_in_course?(record.assignment.course_id)
  end

  def update?
    admin_user? || teacher_enrolled_in_assignment_course?
  end

  def grade?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_user?

      return teacher_scope if user.has_role?(:teacher)
      return scope.where(user_id: user.id) if user.has_role?(:student)

      scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin)
    end

    def teacher_scope
      scope.joins(:assignment)
        .where(assignments: { course_id: taught_course_ids })
        .distinct
    end

    def taught_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id, role: "teacher")
        .distinct
        .pluck("sections.course_id")
    end
  end

  private

  def owns_submission?
    record.user_id == user.id
  end

  def admin_user?
    user.has_role?(:admin)
  end

  def teacher_enrolled_in_assignment_course?
    user.has_role?(:teacher) && teaches_course?(record.assignment.course_id)
  end

  def teaches_course?(course_id)
    return false unless course_id

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end

  def enrolled_student_in_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "student",
      sections: { course_id: course_id }
    )
  end
end
