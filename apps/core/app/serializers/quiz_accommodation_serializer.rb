class QuizAccommodationSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :quiz_id, :user_id, :extra_time_minutes,
             :extra_attempts, :notes, :created_at, :updated_at
end
