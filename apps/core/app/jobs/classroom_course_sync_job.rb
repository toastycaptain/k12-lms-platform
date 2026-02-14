class ClassroomCourseSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, user_id)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    user = User.find(user_id)

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "course_sync",
      direction: "pull",
      triggered_by: user
    )
    sync_run.start!

    begin
      classroom_service = GoogleClassroomService.new(user)
      courses = classroom_service.list_courses

      courses.each do |classroom_course|
        sync_run.update!(records_processed: sync_run.records_processed + 1)
        begin
          mapping = SyncMapping.find_external(config, "classroom_course", classroom_course.id)

          if mapping
            local_course = Course.find(mapping.local_id)
            if local_course.name != classroom_course.name
              local_course.update!(name: classroom_course.name)
              sync_run.log_info("Updated course name", entity_type: "Course", entity_id: local_course.id, external_id: classroom_course.id)
            end
          else
            academic_year = AcademicYear.first
            local_course = Course.create!(
              name: classroom_course.name,
              code: classroom_course.id,
              tenant: config.tenant,
              academic_year: academic_year
            )
            SyncMapping.create!(
              tenant: config.tenant,
              integration_config: config,
              local_type: "Course",
              local_id: local_course.id,
              external_id: classroom_course.id,
              external_type: "classroom_course",
              last_synced_at: Time.current
            )
            sync_run.log_info("Created course", entity_type: "Course", entity_id: local_course.id, external_id: classroom_course.id)
          end

          mapping&.update!(last_synced_at: Time.current)
          sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        rescue => e
          sync_run.update!(records_failed: sync_run.records_failed + 1)
          sync_run.log_error("Failed to sync course: #{e.message}", external_id: classroom_course.id)
        end
      end

      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end
end
