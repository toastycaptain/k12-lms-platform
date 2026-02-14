class DiscussionSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :created_by_id, :title, :description, :status,
    :pinned, :require_initial_post, :created_at, :updated_at
end
