class Message < ApplicationRecord
  include TenantScoped

  belongs_to :message_thread, counter_cache: true
  belongs_to :sender, class_name: "User"

  validates :body, presence: true

  after_create :update_thread_timestamp
  after_create :notify_other_participants

  private

  def update_thread_timestamp
    message_thread.touch
  end

  def notify_other_participants
    return unless defined?(NotificationService)

    message_thread.participants.where.not(id: sender_id).find_each do |participant|
      NotificationService.notify(
        user: participant,
        event_type: "message_received",
        title: "New message in #{message_thread.subject}",
        message: body.to_s.truncate(140),
        url: "/communicate/threads/#{message_thread_id}",
        actor: sender,
        notifiable: self,
        metadata: {
          thread_id: message_thread_id,
          thread_subject: message_thread.subject,
          sender_name: sender.first_name.presence || sender.email
        }
      )
    end
  rescue StandardError => e
    Rails.logger.warn("message.notify_other_participants_failed #{e.class}: #{e.message}")
    nil
  end
end
