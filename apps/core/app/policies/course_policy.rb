# frozen_string_literal: true

class CoursePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || enrolled_course_ids.include?(record.id)
  end

  def create?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def update?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def destroy?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?

      scope.joins(sections: :enrollments).where(enrollments: { user_id: user.id }).distinct
    end

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
    end
  end

  private

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def enrolled_course_ids
    @enrolled_course_ids ||= Enrollment.joins(:section)
      .where(user_id: user.id)
      .distinct
      .pluck("sections.course_id")
  end
end
