class GuardianGradeSerializer < ActiveModel::Serializer
  attributes :id,
    :assignment_id,
    :assignment_title,
    :course_id,
    :course_name,
    :score,
    :points_possible,
    :percentage,
    :graded_at,
    :status

  def assignment_id
    object.assignment_id
  end

  def assignment_title
    object.assignment&.title
  end

  def course_id
    object.assignment&.course_id
  end

  def course_name
    object.assignment&.course&.name
  end

  def score
    object.grade&.to_f
  end

  def points_possible
    object.assignment&.points_possible&.to_f
  end

  def percentage
    return nil if object.grade.blank? || object.assignment&.points_possible.blank? || object.assignment.points_possible.to_f <= 0

    ((object.grade.to_f / object.assignment.points_possible.to_f) * 100).round(2)
  end
end
