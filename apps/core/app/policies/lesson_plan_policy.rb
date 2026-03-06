# frozen_string_literal: true

class LessonPlanPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    school_matches_current_context?
  end

  def create?
    school_matches_current_context? && (user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher))
  end

  def update?
    school_matches_current_context? && (user.has_role?(:admin) || record.created_by_id == user.id)
  end

  def destroy?
    school_matches_current_context? && (user.has_role?(:admin) || record.created_by_id == user.id)
  end

  def create_version?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.all
      if Current.respond_to?(:school) && Current.school.present?
        scoped = scoped.joins(unit_plan: :course).where(courses: { school_id: Current.school.id })
      end
      scoped
    end
  end

  private

  def school_matches_current_context?
    return true unless Current.respond_to?(:school) && Current.school.present?

    record.unit_plan&.course&.school_id == Current.school.id
  end
end
