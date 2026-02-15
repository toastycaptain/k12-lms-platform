class DiscussionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_discussion? || enrolled_in_course?(record.course_id)
  end

  def create?
    privileged_user? || (user.has_role?(:teacher) && teaches_course?(record.course_id))
  end

  def update?
    privileged_user? || owns_discussion? || teaches_course?(record.course_id)
  end

  def destroy?
    update?
  end

  def lock?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.where(created_by_id: user.id)
          .or(scope.where(course_id: taught_course_ids))
          .distinct
      end

      if user.has_role?(:student)
        return scope.where(course_id: enrolled_student_course_ids)
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

    def enrolled_student_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id, role: "student")
        .distinct
        .pluck("sections.course_id")
    end
  end

  private

  def owns_discussion?
    record.created_by_id == user.id
  end

  def teaches_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end

  def enrolled_in_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      sections: { course_id: course_id }
    )
  end
end
