class NotificationMailer < ApplicationMailer
  def notification_email(user_id:, event_type:, title:, message: nil, url: nil, metadata: {}, notification_id: nil)
    @user = User.find(user_id)
    @notification = notification_id.present? ? Notification.find_by(id: notification_id) : nil
    @event_type = event_type.to_s
    @metadata = metadata.to_h.with_indifferent_access
    @title = title.presence || @notification&.title || "K-12 LMS Notification"
    @message = message.presence || @notification&.message
    @url = url.presence || @notification&.url

    mail(
      to: @user.email,
      subject: notification_subject
    )
  end

  def daily_digest(user_id, notification_ids, frequency: "daily")
    @user = User.find(user_id)
    @notifications = Notification.where(user_id: @user.id, id: notification_ids).order(created_at: :desc)
    @frequency = frequency

    label = frequency == "weekly" ? "Weekly Summary" : "Daily Summary"
    mail(
      to: @user.email,
      subject: "#{label} — #{Date.current.strftime('%b %d, %Y')}"
    )
  end

  private

  def notification_subject
    case @event_type
    when "assignment_graded"
      "Grade posted: #{metadata_value(:assignment_title) || @title}"
    when "assignment_due_soon"
      "Due soon: #{metadata_value(:assignment_title) || @title}"
    when "announcement_posted"
      "New announcement: #{metadata_value(:title) || @title}"
    when "submission_received"
      "Submission received from #{metadata_value(:student_name) || 'a student'}"
    when "approval_requested"
      "Approval needed: #{metadata_value(:title) || @title}"
    when "approval_resolved"
      "Approval update: #{metadata_value(:title) || @title}"
    when "message_received"
      "New message from #{metadata_value(:sender_name) || 'a participant'}"
    else
      @title
    end
  end

  def metadata_value(key)
    @metadata[key]
  end
end
