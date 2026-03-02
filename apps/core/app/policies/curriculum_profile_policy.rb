class CurriculumProfilePolicy < ApplicationPolicy
  def index?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return CurriculumProfileRegistry.all if user.has_role?(:admin)

      []
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
