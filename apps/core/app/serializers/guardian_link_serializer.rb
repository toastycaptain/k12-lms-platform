class GuardianLinkSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :guardian_id, :student_id, :relationship, :status, :created_at, :updated_at

  belongs_to :guardian, serializer: UserSerializer
  belongs_to :student, serializer: UserSerializer
end
