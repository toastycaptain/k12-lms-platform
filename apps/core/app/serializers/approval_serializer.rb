class ApprovalSerializer < ActiveModel::Serializer
  attributes :id, :approvable_type, :approvable_id, :status, :requested_by_id,
             :reviewed_by_id, :comments, :reviewed_at, :created_at, :updated_at
end
