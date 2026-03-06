# frozen_string_literal: true

class CoursePolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    return false unless school_matches_current_context?

    privileged_user? || enrolled_course_ids.include?(record.id)
  end

  def gradebook?
    return false unless school_matches_current_context?

    privileged_user? || teacher_course_ids.include?(record.id)
  end

  def gradebook_export?
    gradebook?
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
      scoped = scope.all
      scoped = scoped.where(school_id: current_school.id) if current_school.present?
      return scoped if privileged_user?

      scoped.joins(sections: :enrollments).where(enrollments: { user_id: user.id }).distinct
    end

    private

    def current_school
      return nil unless Current.respond_to?(:school)

      Current.school
    end
  end

  private

  def school_matches_current_context?
    return true unless Current.respond_to?(:school) && Current.school.present?

    record.school_id == Current.school.id
  end

  def enrolled_course_ids
    @enrolled_course_ids ||= Enrollment.joins(:section)
      .where(user_id: user.id)
      .distinct
      .pluck("sections.course_id")
  end

  def teacher_course_ids
    @teacher_course_ids ||= Enrollment.joins(:section)
      .where(user_id: user.id, role: "teacher")
      .distinct
      .pluck("sections.course_id")
  end
end
