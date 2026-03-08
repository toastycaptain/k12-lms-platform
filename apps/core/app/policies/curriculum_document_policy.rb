# frozen_string_literal: true

class CurriculumDocumentPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_document? || teaches_context_course?
  end

  def create?
    privileged_user? || user.has_role?(:teacher)
  end

  def update?
    privileged_user? || owns_document?
  end

  def destroy?
    update?
  end

  def transition?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.all
      if (school = current_school)
        scoped = scoped.where(school_id: school.id)
      end
      return scoped if privileged_user?

      owned_scope = scoped.where(id: scoped.where(created_by_id: user.id).select(:id))
      teacher_scope = scoped.where(
        id: scoped
        .joins(planning_context: { courses: { sections: :enrollments } })
        .where(enrollments: { user_id: user.id, role: "teacher" })
        .select(:id)
      )

      owned_scope.or(teacher_scope).distinct
    end

    private

    def current_school
      return nil unless Current.respond_to?(:school)

      Current.school
    end
  end

  private

  def owns_document?
    record.created_by_id == user.id
  end

  def teaches_context_course?
    record.planning_context
      .courses
      .joins(sections: :enrollments)
      .where(enrollments: { user_id: user.id, role: "teacher" })
      .exists?
  end
end
