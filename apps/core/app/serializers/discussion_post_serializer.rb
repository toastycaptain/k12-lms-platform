class DiscussionPostSerializer < ActiveModel::Serializer
  attributes :id, :discussion_id, :parent_post_id, :created_by_id, :content,
    :created_at, :updated_at
end
