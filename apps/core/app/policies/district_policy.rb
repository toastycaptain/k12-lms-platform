class DistrictPolicy < ApplicationPolicy
  def schools?
    district_admin?
  end

  def standards_coverage?
    district_admin?
  end

  def user_summary?
    district_admin?
  end

  def push_template?
    district_admin?
  end

  private

  def district_admin?
    user&.district_admin?
  end
end
