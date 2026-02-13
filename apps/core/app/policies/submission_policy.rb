class SubmissionPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    user.has_role?(:admin) || user.has_role?(:teacher) || record.user_id == user.id
  end

  def create?
    user.has_role?(:student)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:teacher)
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end
end
