class DrivePolicy < ApplicationPolicy
  def create_document?
    true
  end

  def create_presentation?
    true
  end

  def show_file?
    true
  end

  def picker_token?
    user.has_role?(:teacher) || user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end
end
