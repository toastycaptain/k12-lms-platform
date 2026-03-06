class IbReflectionRequestSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :ib_evidence_item_id, :requested_by_id, :student_id, :status, :due_on,
    :prompt, :response_excerpt, :responded_at, :metadata, :created_at, :updated_at
end
