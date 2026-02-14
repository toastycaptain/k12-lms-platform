class QuestionBankPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    privileged_user? || owns_bank?
  end

  def create?
    privileged_user? || user.has_role?(:teacher)
  end

  def update?
    privileged_user? || owns_bank?
  end

  def destroy?
    update?
  end

  def archive?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?
      return scope.where(created_by_id: user.id) if user.has_role?(:teacher)

      scope.none
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

  def owns_bank?
    record.created_by_id == user.id
  end
end
