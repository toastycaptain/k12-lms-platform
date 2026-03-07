# frozen_string_literal: true

class IbSchoolScopedPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    accessible_for_ib?
  end

  def create?
    manageable_for_ib?
  end

  def update?
    manageable_for_ib?
  end

  def destroy?
    privileged_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scoped = scope.all
      scoped = scoped.where(tenant_id: user.tenant_id) if scope.column_names.include?("tenant_id")
      if (school = current_school) && scope.column_names.include?("school_id")
        scoped = scoped.where(school_id: school.id)
      end
      scoped
    end

    private

    def current_school
      return nil unless Current.respond_to?(:school)

      Current.school
    end
  end

  private

  def accessible_for_ib?
    same_school_or_unscoped? && (privileged_user? || ownerish? || ib_participant?)
  end

  def manageable_for_ib?
    same_school_or_unscoped? && (privileged_user? || ownerish? || user.has_role?(:teacher))
  end

  def ib_participant?
    user.has_role?(:teacher) || user.has_role?(:curriculum_lead) || user.has_role?(:district_admin) || user.has_role?(:guardian) || user.has_role?(:student)
  end

  def ownerish?
    return false if record.is_a?(Class)

    [ :created_by_id, :author_id, :owner_id, :coordinator_id, :updated_by_id, :user_id ].any? do |field|
      record.respond_to?(field) && record.public_send(field) == user.id
    end ||
      (record.respond_to?(:curriculum_document) && record.curriculum_document&.created_by_id == user.id) ||
      (record.respond_to?(:ib_learning_story) && record.ib_learning_story&.created_by_id == user.id)
  end

  def same_school_or_unscoped?
    return true unless record.respond_to?(:school_id)
    return true unless Current.respond_to?(:school)
    return true if Current.school.nil?

    record.school_id == Current.school.id
  end
end
