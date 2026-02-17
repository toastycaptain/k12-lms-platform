class NotificationDigestJob < ApplicationJob
  queue_as :default

  def perform(frequency)
    frequency = frequency.to_s
    return unless %w[daily weekly].include?(frequency)

    since = frequency == "daily" ? 1.day.ago : 1.week.ago
    scoped_preferences = NotificationPreference.where(email: true, email_frequency: frequency)
                                               .pluck(:tenant_id, :user_id)
                                               .uniq

    scoped_preferences.each do |_tenant_id, user_id|
      user = User.find_by(id: user_id)
      next if user.blank?

      Current.tenant = user.tenant
      notification_ids = user.notifications.unread.where("created_at >= ?", since).pluck(:id)
      next if notification_ids.empty?

      NotificationMailer.daily_digest(user.id, notification_ids, frequency: frequency).deliver_later
    end
  ensure
    Current.tenant = nil
  end
end
