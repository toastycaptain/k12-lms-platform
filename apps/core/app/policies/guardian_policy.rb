class GuardianPolicy < ApplicationPolicy
  def index?
    guardian_user?
  end

  def show?
    guardian_user? && GuardianLink.active.exists?(guardian_id: user.id, student_id: student_id)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user&.has_role?(:guardian)

      scope.where(id: GuardianLink.active.where(guardian_id: user.id).select(:student_id))
    end
  end

  private

  def guardian_user?
    user&.has_role?(:guardian)
  end

  def student_id
    case record
    when User
      record.id
    else
      record.to_i
    end
  end
end
