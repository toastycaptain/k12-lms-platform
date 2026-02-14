# frozen_string_literal: true

class UnitPlanPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_record? || teaches_course?(record.course_id)
  end

  def create?
    privileged_user? || user.has_role?(:teacher)
  end

  def update?
    user.has_role?(:admin) || owns_record?
  end

  def destroy?
    user.has_role?(:admin) || owns_record?
  end

  def create_version?
    update?
  end

  def publish?
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
      return scope.all if privileged_user?

      return teacher_scope if user.has_role?(:teacher)

      scope.where(created_by_id: user.id)
    end

    private

    def privileged_user?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead)
    end

    def teacher_scope
      scope.where(created_by_id: user.id)
        .or(scope.where(course_id: taught_course_ids))
        .distinct
    end

    def taught_course_ids
      Course.joins(sections: :enrollments)
        .where(enrollments: { user_id: user.id, role: "teacher" })
        .select(:id)
    end
  end

  private

  def privileged_user?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
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
