class CurriculumSettingsPolicy < ApplicationPolicy
  def show?
    admin_user?
  end

  def update?
    admin_user?
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
