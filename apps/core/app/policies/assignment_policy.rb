class AssignmentPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_assignment? || teaches_course?(record.course_id) || student_can_view?
  end

  def create?
    privileged_user? || (user.has_role?(:teacher) && teaches_course?(record.course_id))
  end

  def update?
    privileged_user? || owns_assignment? || teaches_course?(record.course_id)
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

  def push_to_classroom?
    update?
  end

  def sync_grades?
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
        return scope.where(course_id: enrolled_student_course_ids, status: %w[published closed])
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

  def owns_assignment?
    record.created_by_id == user.id
  end

  def teaches_course?(course_id)
    return false unless course_id

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end

  def student_can_view?
    return false unless user.has_role?(:student)
    return false unless %w[published closed].include?(record.status)

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "student",
      sections: { course_id: record.course_id }
    )
  end
end
