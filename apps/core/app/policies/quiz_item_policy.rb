class QuizItemPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    admin_user? || teacher_enrolled_in_course?(record.quiz&.course_id)
  end

  def update?
    create?
  end

  def destroy?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_user?
      return teacher_scope if user.has_role?(:teacher)
      return student_scope if user.has_role?(:student)

      scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin)
    end

    def teacher_scope
      scope.joins(:quiz)
        .where(quizzes: { course_id: taught_course_ids })
        .distinct
    end

    def student_scope
      scope.joins(:quiz)
        .where(
          quizzes: {
            course_id: enrolled_student_course_ids,
            status: "published"
          }
        )
        .distinct
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

  def admin_user?
    user.has_role?(:admin)
  end

  def teacher_enrolled_in_course?(course_id)
    return false unless course_id && user.has_role?(:teacher)

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end
end
