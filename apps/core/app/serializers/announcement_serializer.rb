class AnnouncementSerializer < ActiveModel::Serializer
  attributes :id, :course_id, :created_by_id, :title, :message, :published_at,
    :pinned, :course_name, :created_by_name, :created_at, :updated_at

  def course_name
    object.course&.name
  end

  def created_by_name
    [ object.created_by&.first_name, object.created_by&.last_name ].compact.join(" ").strip
  end
end
