class QuizAttemptPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || record.user_id == user.id || manages_quiz?(record.quiz)
  end

  def create?
    return true if privileged_user?
    return manages_quiz?(record.quiz) if user.has_role?(:teacher)

    user.has_role?(:student) && enrolled_student_in_course?(record.quiz.course_id)
  end

  def submit?
    record.user_id == user.id
  end

  def grade_all?
    privileged_user? || manages_quiz?(record.quiz)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.joins(:quiz)
          .where(quizzes: { created_by_id: user.id })
          .or(
            scope.joins(:quiz).where(quizzes: { course_id: taught_course_ids })
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

  def manages_quiz?(quiz)
    quiz.created_by_id == user.id || teaches_course?(quiz.course_id)
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
