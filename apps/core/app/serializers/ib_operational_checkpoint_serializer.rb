class IbOperationalCheckpointSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :ib_operational_record_id, :reviewer_id, :position, :status, :due_on,
    :completed_at, :title, :summary, :metadata, :created_at, :updated_at
end
