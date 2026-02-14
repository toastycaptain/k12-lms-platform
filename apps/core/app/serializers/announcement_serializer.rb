class AnnouncementSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :created_by_id, :title, :message, :published_at,
    :pinned, :created_at, :updated_at
end
