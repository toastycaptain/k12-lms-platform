class QuizAttemptPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin_user? || record.user_id == user.id || manages_quiz?(record.quiz)
  end

  def create?
    user.has_role?(:student) &&
      quiz_published?(record.quiz) &&
      enrolled_student_in_course?(record.quiz.course_id)
  end

  def submit?
    record.user_id == user.id
  end

  def grade_all?
    admin_user? || manages_quiz?(record.quiz)
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
      scope.joins(:quiz)
        .where(quizzes: { course_id: taught_course_ids })
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

  def admin_user?
    user.has_role?(:admin)
  end

  def manages_quiz?(quiz)
    user.has_role?(:teacher) && teaches_course?(quiz.course_id)
  end

  def quiz_published?(quiz)
    quiz&.status == "published"
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
