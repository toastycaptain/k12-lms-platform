# frozen_string_literal: true

class IbEvidenceItemPolicy < IbSchoolScopedPolicy
  def summary?
    index?
  end
end
