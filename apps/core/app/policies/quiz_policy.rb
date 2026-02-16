class QuizPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    return true if privileged_user?
    return teacher_enrolled_in_course?(record.course_id) if user.has_role?(:teacher)

    student_can_view?
  end

  def create?
    privileged_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def update?
    privileged_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def destroy?
    update?
  end

  def publish?
    update?
  end

  def close?
    update?
  end

  def results?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      return teacher_scope if user.has_role?(:teacher)
      return student_scope if user.has_role?(:student)

      scope.none
    end

    private

    def teacher_scope
      scope.where(course_id: taught_course_ids).distinct
    end

    def student_scope
      scope.where(course_id: enrolled_student_course_ids, status: "published")
    end

    def taught_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id, role: "teacher")
        .distinct
        .pluck("sections.course_id")
    end

    def enrolled_student_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id, role: "student")
        .distinct
        .pluck("sections.course_id")
    end
  end

  private

  def teacher_enrolled_in_course?(course_id)
    return false unless course_id && user.has_role?(:teacher)

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end

  def student_can_view?
    return false unless user.has_role?(:student)
    return false unless record.status == "published"

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "student",
      sections: { course_id: record.course_id }
    )
  end
end
