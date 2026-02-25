class StudentSummarySerializer < ActiveModel::Serializer
  attributes :id, :first_name, :last_name, :email, :course_count, :courses

  def courses
    @courses ||= begin
      object.enrollments.includes(section: :course)
            .map { |enrollment| enrollment.section&.course }
            .compact
            .uniq { |course| course.id }
            .map { |course| { id: course.id, name: course.name, code: course.code } }
    end
  end

  def course_count
    courses.length
  end
end
