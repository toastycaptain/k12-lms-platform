class ModuleItemCompletionPolicy < ApplicationPolicy
  def create?
    privileged_user? || enrolled_student_in_course?
  end

  def destroy?
    create?
  end

  def progress?
    privileged_user? || teaches_course? || enrolled_student_in_course?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      if user.has_role?(:teacher)
        return scope.joins(module_item: :course_module).where(course_modules: { course_id: taught_course_ids })
      end

      if user.has_role?(:student)
        return scope.joins(module_item: { course_module: { course: { sections: :enrollments } } })
          .where(enrollments: { user_id: user.id, role: "student" })
          .distinct
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

  def module_item
    return record.module_item if record.respond_to?(:module_item) && record.module_item.present?
    return record if record.is_a?(ModuleItem)

    nil
  end

  def course_id
    module_item&.course_module&.course_id
  end

  def enrolled_student_in_course?
    return false unless user.has_role?(:student)
    return false unless course_id

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "student",
      sections: { course_id: course_id }
    )
  end

  def teaches_course?
    return false unless course_id

    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end
end
