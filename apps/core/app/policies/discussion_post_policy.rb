class DiscussionPostPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    privileged_user? || owns_post? || enrolled_in_course?(record.discussion.course_id)
  end

  def destroy?
    privileged_user? || owns_post? || teaches_course?(record.discussion.course_id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.joins(:discussion)
          .where(created_by_id: user.id)
          .or(scope.joins(:discussion).where(discussions: { course_id: taught_course_ids }))
          .distinct
      end

      if user.has_role?(:student)
        return scope.joins(:discussion).where(discussions: { course_id: enrolled_student_course_ids })
      end

      scope.none
    end

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
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

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def owns_post?
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
