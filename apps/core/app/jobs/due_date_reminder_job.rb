class DueDateReminderJob < ApplicationJob
  queue_as :default

  def perform(reference_time = Time.current)
    window_start = reference_time
    window_end = reference_time + 24.hours

    Assignment.where(status: "published", due_at: window_start..window_end).find_each do |assignment|
      Current.tenant = assignment.tenant

      student_ids = Enrollment.joins(:section)
                              .where(role: "student", sections: { course_id: assignment.course_id })
                              .distinct
                              .pluck(:user_id)
      next if student_ids.empty?

      submitted_ids = Submission.where(assignment_id: assignment.id, user_id: student_ids).pluck(:user_id)
      pending_student_ids = student_ids - submitted_ids

      pending_student_ids.each do |student_id|
        next if reminder_already_sent?(assignment.id, student_id)

        student = User.find_by(id: student_id)
        next if student.blank?

        NotificationService.notify(
          user: student,
          event_type: "assignment_due_soon",
          title: "Due soon: #{assignment.title}",
          message: "Your assignment is due within 24 hours.",
          url: "/learn/courses/#{assignment.course_id}/assignments/#{assignment.id}",
          notifiable: assignment,
          metadata: {
            assignment_id: assignment.id,
            assignment_title: assignment.title,
            due_at: assignment.due_at&.iso8601
          }
        )
      end
    end
  ensure
    Current.tenant = nil
  end

  private

  def reminder_already_sent?(assignment_id, user_id)
    Notification.where(
      user_id: user_id,
      notification_type: "assignment_due_soon",
      notifiable_type: "Assignment",
      notifiable_id: assignment_id
    ).exists?
  end
end
