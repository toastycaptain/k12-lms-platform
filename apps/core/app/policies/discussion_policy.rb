class DiscussionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin_user? || enrolled_in_course?(record.course_id)
  end

  def create?
    admin_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def update?
    admin_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def destroy?
    update?
  end

  def lock?
    admin_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def unlock?
    lock?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if admin_user?

      return scope.where(course_id: taught_course_ids).distinct if user.has_role?(:teacher)
      return scope.where(course_id: enrolled_student_course_ids) if user.has_role?(:student)

      scope.none
    end

    private

    def admin_user?
      user.has_role?(:admin)
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

  def enrolled_in_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      sections: { course_id: course_id }
    )
  end
end
