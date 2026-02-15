class NotificationService
  class << self
    def notify(user:, type:, title:, message: nil, url: nil, actor: nil, notifiable: nil)
      return if Current.tenant.blank?

      Notification.create!(
        tenant: Current.tenant,
        user: user,
        actor: actor,
        notification_type: type,
        title: title,
        message: message,
        url: url,
        notifiable: notifiable
      )
    rescue StandardError => e
      Rails.logger.warn("notification.notify_failed #{e.class}: #{e.message}")
      nil
    end

    def notify_enrolled_students(course:, type:, title:, message: nil, url: nil, actor: nil, notifiable: nil)
      student_ids = Enrollment.where(section: course.sections, role: "student").distinct.pluck(:user_id)
      User.where(id: student_ids).find_each do |student|
        notify(
          user: student,
          type: type,
          title: title,
          message: message,
          url: url,
          actor: actor,
          notifiable: notifiable
        )
      end
    rescue StandardError => e
      Rails.logger.warn("notification.notify_enrolled_students_failed #{e.class}: #{e.message}")
      nil
    end
  end
end
