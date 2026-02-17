class NotificationPreferenceSerializer < ActiveModel::Serializer
  attributes :event_type, :event_name, :in_app, :email, :email_frequency

  def event_name
    NotificationPreference.event_name(object.event_type)
  end
end
