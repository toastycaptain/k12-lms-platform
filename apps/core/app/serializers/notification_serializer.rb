class NotificationSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :actor_id, :notification_type, :title, :message,
    :url, :notifiable_type, :notifiable_id, :metadata, :read_at, :created_at, :updated_at
end
