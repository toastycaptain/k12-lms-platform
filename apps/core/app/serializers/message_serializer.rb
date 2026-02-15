class MessageSerializer < ActiveModel::Serializer
  attributes :id, :message_thread_id, :sender_id, :body, :sender, :created_at, :updated_at

  def sender
    {
      id: object.sender.id,
      first_name: object.sender.first_name,
      last_name: object.sender.last_name,
      roles: object.sender.roles.pluck(:name)
    }
  end
end
