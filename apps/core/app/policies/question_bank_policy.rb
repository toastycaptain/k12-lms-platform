class QuestionBankPolicy < ApplicationPolicy
  def index?
    content_creator?
  end

  def show?
    content_creator?
  end

  def create?
    content_creator?
  end

  def update?
    content_creator?
  end

  def destroy?
    update?
  end

  def archive?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      content_creator? ? scope.all : scope.none
    end

    private

    def content_creator?
      user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
    end
  end

  private

  def content_creator?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end
end
