class ClassroomRosterSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, user_id, course_sync_mapping_id)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    user = User.find(user_id)
    course_mapping = SyncMapping.find(course_sync_mapping_id)

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "roster_sync",
      direction: "pull",
      triggered_by: user
    )
    sync_run.start!

    begin
      local_course = Course.find(course_mapping.local_id)
      section = local_course.sections.first

      unless section
        term = Term.first
        section = Section.create!(
          tenant: config.tenant,
          course: local_course,
          term: term,
          name: "#{local_course.name} - Section 1"
        )
      end

      classroom_service = GoogleClassroomService.new(user)
      students = classroom_service.list_students(course_mapping.external_id)
      domain = config.settings&.dig("domain")

      processed = 0
      succeeded = 0
      failed = 0

      students.each do |student|
        processed += 1
        begin
          email = student.profile&.email_address
          next unless email.present?

          if domain.present? && !email.end_with?("@#{domain}")
            sync_run.log_warn("Skipping student outside domain: #{email}", external_id: student.user_id)
            next
          end

          local_user = User.find_or_create_by!(email: email) do |u|
            u.tenant = config.tenant
            u.first_name = student.profile&.name&.given_name || "Unknown"
            u.last_name = student.profile&.name&.family_name || "Student"
          end
          local_user.add_role(:student)

          enrollment = Enrollment.find_or_create_by!(user: local_user, section: section) do |e|
            e.tenant = config.tenant
            e.role = "student"
          end

          SyncMapping.find_or_create_by!(
            integration_config: config,
            external_type: "classroom_student",
            external_id: student.user_id
          ) do |m|
            m.tenant = config.tenant
            m.local_type = "Enrollment"
            m.local_id = enrollment.id
            m.last_synced_at = Time.current
          end

          sync_run.log_info("Synced student", entity_type: "Enrollment", entity_id: enrollment.id, external_id: student.user_id)
          succeeded += 1
        rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique, Google::Apis::Error => e
          failed += 1
          sync_run.log_error("Failed to sync student: #{e.message}", external_id: student.user_id)
        end
      end

      sync_run.update!(records_processed: sync_run.records_processed + processed, records_succeeded: sync_run.records_succeeded + succeeded, records_failed: sync_run.records_failed + failed)
      sync_run.complete!
    rescue StandardError => e
      sync_run.fail!(e.message)
      raise
    end
  end
end
