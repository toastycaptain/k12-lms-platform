# frozen_string_literal: true

class PlanningContextPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || record.created_by_id == user.id || teaches_any_context_course?
  end

  def create?
    privileged_user? || user.has_role?(:teacher)
  end

  def update?
    privileged_user? || record.created_by_id == user.id
  end

  def destroy?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.all
      if (school = current_school)
        scoped = scoped.where(school_id: school.id)
      end
      return scoped if privileged_user?

      teacher_scope = scoped
        .joins(planning_context_courses: { course: { sections: :enrollments } })
        .where(enrollments: { user_id: user.id, role: "teacher" })
      scoped.where(created_by_id: user.id).or(teacher_scope).distinct
    end

    private

    def current_school
      return nil unless Current.respond_to?(:school)

      Current.school
    end
  end

  private

  def teaches_any_context_course?
    record.courses
      .joins(sections: :enrollments)
      .where(enrollments: { user_id: user.id, role: "teacher" })
      .exists?
  end
end
