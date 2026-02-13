class SubmissionSerializer < ActiveModel::Serializer
  attributes :id, :assignment_id, :user_id, :submission_type, :body, :url,
    :status, :submitted_at, :attempt_number, :grade, :graded_at, :graded_by_id,
    :feedback, :created_at, :updated_at
end
