class ClassroomCourseworkPushJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, user_id, assignment_id)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    user = User.find(user_id)
    assignment = Assignment.find(assignment_id)

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "coursework_push",
      direction: "push",
      triggered_by: user
    )
    sync_run.start!

    begin
      course_mapping = SyncMapping.find_local(config, "Course", assignment.course_id)
      raise "No course mapping found for course #{assignment.course_id}" unless course_mapping

      classroom_service = GoogleClassroomService.new(user)
      coursework_mapping = SyncMapping.find_local(config, "Assignment", assignment.id)

      sync_run.update!(records_processed: sync_run.records_processed + 1)

      attrs = {
        title: assignment.title,
        description: assignment.description,
        max_points: assignment.points_possible,
        work_type: "ASSIGNMENT",
        due_date: assignment.due_at
      }

      if coursework_mapping
        classroom_service.update_coursework(
          course_mapping.external_id,
          coursework_mapping.external_id,
          attrs
        )
        coursework_mapping.update!(last_synced_at: Time.current)
        sync_run.log_info("Updated coursework", entity_type: "Assignment", entity_id: assignment.id, external_id: coursework_mapping.external_id)
      else
        result = classroom_service.create_coursework(course_mapping.external_id, attrs)
        SyncMapping.create!(
          tenant: config.tenant,
          integration_config: config,
          local_type: "Assignment",
          local_id: assignment.id,
          external_id: result.id,
          external_type: "classroom_coursework",
          last_synced_at: Time.current
        )
        sync_run.log_info("Created coursework", entity_type: "Assignment", entity_id: assignment.id, external_id: result.id)
      end

      sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
      sync_run.complete!
    rescue => e
      sync_run.update!(records_failed: (sync_run.records_failed || 0) + 1)
      sync_run.fail!(e.message)
      raise
    end
  end
end
