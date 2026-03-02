# frozen_string_literal: true

class UserPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end

  def search?
    true
  end

  def show?
    user.has_role?(:admin) || record.id == user.id
  end

  def create?
    user.has_role?(:admin)
  end

  def update?
    user.has_role?(:admin) || record.id == user.id
  end

  def destroy?
    user.has_role?(:admin) && record.id != user.id
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:curriculum_lead)
        scope.all
      else
        scope.where(id: user.id)
      end
    end
  end

  class SearchScope < ApplicationPolicy::Scope
    def resolve
      return scope.all unless user.has_role?(:guardian)

      linked_student_ids = GuardianLink.active.where(guardian_id: user.id).select(:student_id)
      section_ids = Enrollment.where(user_id: linked_student_ids, role: "student").select(:section_id)
      teacher_ids = Enrollment.where(section_id: section_ids, role: "teacher").select(:user_id)
      co_guardian_ids = GuardianLink.active.where(student_id: linked_student_ids).select(:guardian_id)

      scope.where(id: linked_student_ids)
        .or(scope.where(id: teacher_ids))
        .or(scope.where(id: co_guardian_ids))
        .or(scope.where(id: user.id))
        .distinct
    end
  end
end
