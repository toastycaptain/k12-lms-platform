# frozen_string_literal: true

class UnitPlanPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    return false unless school_matches_current_context?

    privileged_user? || owns_record? || teaches_course?(record.course_id)
  end

  def create?
    privileged_user? || user.has_role?(:teacher)
  end

  def update?
    return false unless school_matches_current_context?

    user.has_role?(:admin) || owns_record?
  end

  def destroy?
    return false unless school_matches_current_context?

    user.has_role?(:admin) || owns_record?
  end

  def create_version?
    update?
  end

  def publish?
    return false unless school_matches_current_context?

    user.has_role?(:admin) || owns_record?
  end

  def archive?
    publish?
  end

  def submit_for_approval?
    publish?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.all
      scoped = scoped.joins(:course).where(courses: { school_id: current_school.id }) if current_school.present?
      return scoped if privileged_user?

      return teacher_scope if user.has_role?(:teacher)

      scoped.where(created_by_id: user.id)
    end

    private

    def teacher_scope
      scoped = scope.all
      scoped = scoped.joins(:course).where(courses: { school_id: current_school.id }) if current_school.present?

      scoped.where(created_by_id: user.id)
        .or(scoped.where(course_id: taught_course_ids))
        .distinct
    end

    def taught_course_ids
      courses = Course.joins(sections: :enrollments)
        .where(enrollments: { user_id: user.id, role: "teacher" })
      courses = courses.where(school_id: current_school.id) if current_school.present?
      courses.select(:id)
    end

    def current_school
      return nil unless Current.respond_to?(:school)

      Current.school
    end
  end

  private

  def school_matches_current_context?
    return true unless Current.respond_to?(:school) && Current.school.present?

    record.course&.school_id == Current.school.id
  end

  def owns_record?
    record.created_by_id == user.id
  end

  def teaches_course?(course_id)
    Enrollment.joins(:section).exists?(
      user_id: user.id,
      role: "teacher",
      sections: { course_id: course_id }
    )
  end
end
