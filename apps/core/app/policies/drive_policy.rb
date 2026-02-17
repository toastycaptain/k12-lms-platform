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
    drive_access_user?
  end

  def share?
    drive_access_user?
  end

  def folder?
    drive_access_user?
  end

  def copy?
    drive_access_user?
  end

  def preview?
    drive_access_user?
  end

  private

  def drive_access_user?
    user.has_role?(:teacher) || user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end
end
