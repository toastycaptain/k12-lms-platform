class CourseModulePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || enrolled_in_course?(record.course_id)
  end

  def create?
    privileged_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def update?
    privileged_user? || teacher_enrolled_in_course?(record.course_id)
  end

  def destroy?
    privileged_user?
  end

  def publish?
    create?
  end

  def archive?
    create?
  end

  def reorder_items?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?
      return scope.where(course_id: taught_course_ids) if user.has_role?(:teacher)
      return scope.where(course_id: enrolled_course_ids) if user.has_role?(:student)

      scope.none
    end

    private

    def taught_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id, role: "teacher")
        .distinct
        .pluck("sections.course_id")
    end

    def enrolled_course_ids
      Enrollment.joins(:section)
        .where(user_id: user.id)
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

  def enrolled_in_course?(course_id)
    return false unless course_id

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      sections: { course_id: course_id }
    )
  end
end
