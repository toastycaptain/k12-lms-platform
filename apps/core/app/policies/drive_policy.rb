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
    true
  end
end
