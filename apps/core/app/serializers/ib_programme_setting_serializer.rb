class IbProgrammeSettingSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :updated_by_id, :programme, :cadence_mode, :review_owner_role,
    :thresholds, :metadata, :scope_level, :created_at, :updated_at
end
