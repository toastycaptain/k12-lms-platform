class EnrollmentSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :section_id, :role, :created_at, :updated_at
end
