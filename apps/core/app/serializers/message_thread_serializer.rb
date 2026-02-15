class MessageThreadSerializer < ActiveModel::Serializer
  attributes :id,
    :course_id,
    :course_name,
    :subject,
    :thread_type,
    :participants,
    :last_message,
    :messages,
    :unread_count,
    :created_at,
    :updated_at

  def course_name
    object.course&.name
  end

  def participants
    object.participants.order(:last_name, :first_name).map do |participant|
      {
        id: participant.id,
        first_name: participant.first_name,
        last_name: participant.last_name,
        roles: participant.roles.pluck(:name)
      }
    end
  end

  def unread_count
    object.unread_count_for(Current.user)
  end

  def last_message
    serialized_message(object.last_message)
  end

  def messages
    return nil unless instance_options[:include_messages]

    object.messages.order(created_at: :asc).map { |message| serialized_message(message) }
  end

  private

  def serialized_message(message)
    return nil unless message

    MessageSerializer.new(message).serializable_hash
  end
end
