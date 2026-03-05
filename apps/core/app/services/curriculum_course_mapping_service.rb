class CurriculumCourseMappingService
  class << self
    def refresh_unresolved!(tenant:)
      unresolved_courses = Course.unscoped.where(tenant_id: tenant.id, school_id: nil)
      schools = School.unscoped.where(tenant_id: tenant.id).order(:id).to_a

      unresolved_courses.find_each do |course|
        deterministic_school = deterministic_school_for(course: course, tenant: tenant, schools: schools)

        if deterministic_school
          course.update!(school_id: deterministic_school.id)
          CurriculumCourseMappingIssue.where(tenant_id: tenant.id, course_id: course.id).delete_all
          next
        end

        issue = CurriculumCourseMappingIssue.find_or_initialize_by(tenant_id: tenant.id, course_id: course.id)
        issue.assign_attributes(
          status: "unresolved",
          reason: "missing_school_id",
          candidate_school_ids: schools.map(&:id),
          metadata: {
            course_name: course.name,
            deterministic_match: false
          }
        )
        issue.save!
      end

      CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
      CurriculumCourseMappingIssue.where(tenant_id: tenant.id, status: "unresolved")
    end

    def resolve!(tenant:, issue_id:, school_id:, actor:)
      issue = CurriculumCourseMappingIssue.find_by!(tenant_id: tenant.id, id: issue_id)
      school = School.find_by!(tenant_id: tenant.id, id: school_id)
      course = Course.unscoped.find_by!(tenant_id: tenant.id, id: issue.course_id)

      course.update!(school_id: school.id)
      issue.resolve!(school: school, actor: actor, metadata: { resolved_course_name: course.name })

      CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
      issue
    end

    private

    def deterministic_school_for(course:, tenant:, schools:)
      return schools.first if schools.length == 1

      default_school_id = tenant.settings&.dig("default_school_id")
      if default_school_id.present?
        school = schools.find { |row| row.id == default_school_id.to_i }
        return school if school
      end

      nil
    end
  end
end
