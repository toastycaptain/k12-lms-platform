class GuardianAssignmentSerializer < ActiveModel::Serializer
  attributes :id,
    :title,
    :description,
    :due_at,
    :course_id,
    :course_name,
    :status,
    :submitted_at,
    :grade,
    :points_possible

  def course_name
    object.course&.name
  end

  def submitted_at
    submission&.submitted_at
  end

  def grade
    submission&.grade&.to_f
  end

  def points_possible
    object.points_possible&.to_f
  end

  def status
    return "missing" if submission.blank? && object.due_at.present? && object.due_at < Time.current
    return "not_submitted" if submission.blank?

    submission.status
  end

  private

  def submission
    submissions_by_assignment[object.id]
  end

  def submissions_by_assignment
    instance_options[:submissions_by_assignment] || {}
  end
end
