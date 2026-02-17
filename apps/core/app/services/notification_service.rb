class NotificationService
  class << self
    def notify(user:, type: nil, event_type: nil, title: nil, message: nil, url: nil, actor: nil, notifiable: nil, metadata: {})
      return if user.blank?

      resolved_event_type = (event_type || type).to_s
      return if resolved_event_type.blank?

      tenant = Current.tenant || user.tenant
      return if tenant.blank?

      preference = NotificationPreference.preference_for(user, resolved_event_type)
      normalized_metadata = metadata.to_h.deep_stringify_keys
      resolved_title = title.presence || default_title(resolved_event_type, normalized_metadata, notifiable)
      resolved_message = message.presence || default_message(resolved_event_type, normalized_metadata)

      notification = nil
      if preference[:in_app]
        notification = Notification.create!(
          tenant: tenant,
          user: user,
          actor: actor,
          notification_type: resolved_event_type,
          title: resolved_title,
          message: resolved_message,
          url: url,
          notifiable: notifiable,
          metadata: normalized_metadata
        )
      end

      if preference[:email] && preference[:email_frequency] == "immediate"
        NotificationMailer.notification_email(
          user_id: user.id,
          event_type: resolved_event_type,
          title: resolved_title,
          message: resolved_message,
          url: url,
          metadata: normalized_metadata,
          notification_id: notification&.id
        ).deliver_later
      end

      notification
    rescue StandardError => e
      Rails.logger.warn("notification.notify_failed #{e.class}: #{e.message}")
      nil
    end

    def notify_enrolled_students(course:, type: nil, event_type: nil, title: nil, message: nil, url: nil, actor: nil, notifiable: nil, metadata: {})
      student_ids = Enrollment.where(section: course.sections, role: "student").distinct.pluck(:user_id)
      User.where(id: student_ids).find_each do |student|
        notify(
          user: student,
          event_type: event_type,
          type: type,
          title: title,
          message: message,
          url: url,
          actor: actor,
          notifiable: notifiable,
          metadata: metadata.to_h.merge("course_id" => course.id)
        )
      end
    rescue StandardError => e
      Rails.logger.warn("notification.notify_enrolled_students_failed #{e.class}: #{e.message}")
      nil
    end

    private

    def default_title(event_type, metadata, notifiable)
      case event_type
      when "assignment_created"
        "New assignment: #{metadata['assignment_title'] || title_from(notifiable, fallback: 'Assignment')}"
      when "assignment_graded"
        "Grade posted: #{metadata['assignment_title'] || title_from(notifiable, fallback: 'Assignment')}"
      when "assignment_due_soon"
        "Due soon: #{metadata['assignment_title'] || title_from(notifiable, fallback: 'Assignment')}"
      when "announcement_posted"
        "New announcement: #{metadata['title'] || title_from(notifiable, fallback: 'Announcement')}"
      when "submission_received"
        "Submission received from #{metadata['student_name'] || 'a student'}"
      when "quiz_graded"
        "Quiz graded: #{metadata['quiz_title'] || title_from(notifiable, fallback: 'Quiz')}"
      when "approval_requested"
        "Approval needed: #{metadata['title'] || title_from(notifiable, fallback: 'Approval request')}"
      when "approval_resolved"
        "Approval update: #{metadata['title'] || title_from(notifiable, fallback: 'Approval request')}"
      when "message_received"
        "New message from #{metadata['sender_name'] || 'a participant'}"
      else
        event_type.humanize
      end
    end

    def default_message(event_type, metadata)
      case event_type
      when "assignment_due_soon"
        due_at = metadata["due_at"]
        due_at.present? ? "This assignment is due at #{due_at}." : nil
      when "submission_received"
        assignment_title = metadata["assignment_title"]
        assignment_title.present? ? "New work submitted for #{assignment_title}." : nil
      else
        nil
      end
    end

    def title_from(notifiable, fallback:)
      return fallback if notifiable.blank?
      return notifiable.title if notifiable.respond_to?(:title) && notifiable.title.present?

      fallback
    end
  end
end
