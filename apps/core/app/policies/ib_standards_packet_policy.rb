# frozen_string_literal: true

class IbStandardsPacketPolicy < IbSchoolScopedPolicy
  def export?
    update?
  end

  def export_preview?
    show?
  end

  def comparison?
    show?
  end

  def assign_reviewer?
    update?
  end

  def approve?
    update?
  end

  def return_packet?
    update?
  end
end
