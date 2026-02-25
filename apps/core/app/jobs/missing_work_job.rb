class MissingWorkJob < ApplicationJob
  queue_as :default

  def perform(reference_time = Time.current)
    cutoff = normalize_cutoff(reference_time)

    Assignment.where(status: "published")
              .where.not(due_at: nil)
              .where("due_at < ?", cutoff)
              .find_each do |assignment|
      mark_missing_for_assignment!(assignment)
    end
  end

  private

  def normalize_cutoff(reference_time)
    case reference_time
    when String
      Time.zone.parse(reference_time) || Time.current
    when Time
      reference_time
    else
      Time.current
    end
  end

  def mark_missing_for_assignment!(assignment)
    student_ids = Enrollment.joins(:section)
                            .where(sections: { course_id: assignment.course_id }, role: "student")
                            .distinct
                            .pluck(:user_id)

    return if student_ids.empty?

    existing = Submission.where(assignment_id: assignment.id, user_id: student_ids).index_by(&:user_id)

    Submission.transaction do
      student_ids.each do |student_id|
        submission = existing[student_id]

        if submission.present?
          next if submission.submitted_at.present?
          next if submission.status == "missing"

          submission.update!(status: "missing")
          next
        end

        Submission.create!(
          tenant_id: assignment.tenant_id,
          assignment_id: assignment.id,
          user_id: student_id,
          status: "missing"
        )
      end
    end
  end
end
