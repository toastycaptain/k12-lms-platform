class DiscussionPostPolicy < ApplicationPolicy
  def index?
    true
  end

  def create?
    enrolled_in_course?(record.discussion.course_id) && discussion_open?(record.discussion)
  end

  def destroy?
    admin_user? || owns_post? || teacher_enrolled_in_course?(record.discussion.course_id)
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
      scope.joins(:discussion).where(discussions: { course_id: taught_course_ids }).distinct
    end

    def student_scope
      scope.joins(:discussion).where(discussions: { course_id: enrolled_student_course_ids }).distinct
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

  def owns_post?
    record.created_by_id == user.id
  end

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

  def enrolled_in_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      sections: { course_id: course_id }
    )
  end

  def discussion_open?(discussion)
    discussion.status != "locked"
  end
end
