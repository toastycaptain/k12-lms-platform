module Curriculum
  class PlanningContextFactory
    class FactoryError < StandardError; end

    class << self
      def create!(tenant:, created_by:, school:, academic_year:, kind:, name:, course_ids: [], settings: {}, metadata: {})
        course_records = Course.where(id: Array(course_ids).map(&:to_i).uniq)
        validate_courses!(tenant: tenant, school: school, courses: course_records)

        PlanningContext.transaction do
          context = PlanningContext.create!(
            tenant: tenant,
            school: school,
            academic_year: academic_year,
            kind: kind,
            name: name,
            settings: settings || {},
            metadata: metadata || {},
            created_by: created_by
          )

          course_records.each do |course|
            PlanningContextCourse.create!(
              tenant: tenant,
              planning_context: context,
              course: course
            )
          end

          context
        end
      end

      def validate_courses!(tenant:, school:, courses:)
        return if courses.empty?

        invalid_course = courses.find { |course| course.tenant_id != tenant.id || course.school_id != school.id }
        return if invalid_course.nil?

        raise FactoryError, "Courses must belong to the same tenant and school as the planning context"
      end
    end
  end
end
