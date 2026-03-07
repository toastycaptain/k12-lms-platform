# frozen_string_literal: true

class IbImportBatchPolicy < IbSchoolScopedPolicy
  def dry_run?
    manageable_for_ib?
  end

  def execute?
    privileged_user?
  end

  def rollback?
    privileged_user?
  end
end
