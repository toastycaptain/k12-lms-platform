class AttemptAnswerPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    record.quiz_attempt.user_id == user.id && record.quiz_attempt.status == "in_progress"
  end

  def grade?
    privileged_user? || manages_quiz?(record.quiz_attempt.quiz)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.joins(quiz_attempt: :quiz)
          .where(quizzes: { created_by_id: user.id })
          .or(
            scope.joins(quiz_attempt: :quiz).where(quizzes: { course_id: taught_course_ids })
          )
          .distinct
      end

      if user.has_role?(:student)
        return scope.joins(:quiz_attempt).where(quiz_attempts: { user_id: user.id })
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
end
