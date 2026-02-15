class SubmissionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_submission? || manages_assignment_course?
  end

  def create?
    user.has_role?(:student) && enrolled_student_in_course?(record.assignment.course_id)
  end

  def grade?
    privileged_user? || manages_assignment_course?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.joins(:assignment)
          .where(assignments: { created_by_id: user.id })
          .or(
            scope.joins(:assignment).where(assignments: { course_id: taught_course_ids })
          )
          .distinct
      end

      if user.has_role?(:student)
        return scope.where(user_id: user.id)
      end

      scope.none
    end

    private

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

  def manages_assignment_course?
    record.assignment.created_by_id == user.id || teaches_course?(record.assignment.course_id)
  end

  def teaches_course?(course_id)
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
