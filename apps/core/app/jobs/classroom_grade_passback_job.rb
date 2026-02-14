class ClassroomGradePassbackJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, user_id, assignment_id)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    user = User.find(user_id)
    assignment = Assignment.find(assignment_id)

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "grade_passback",
      direction: "push",
      triggered_by: user
    )
    sync_run.start!

    begin
      course_mapping = SyncMapping.find_local(config, "Course", assignment.course_id)
      raise "No course mapping found for course #{assignment.course_id}" unless course_mapping

      coursework_mapping = SyncMapping.find_local(config, "Assignment", assignment.id)
      raise "No coursework mapping found for assignment #{assignment.id}" unless coursework_mapping

      classroom_service = GoogleClassroomService.new(user)
      classroom_submissions = classroom_service.list_student_submissions(
        course_mapping.external_id,
        coursework_mapping.external_id
      )

      graded_submissions = assignment.submissions.where(status: %w[graded returned]).where.not(grade: nil)

      graded_submissions.each do |submission|
        sync_run.update!(records_processed: sync_run.records_processed + 1)
        begin
          student_mapping = SyncMapping.where(
            integration_config: config,
            local_type: "Enrollment",
            external_type: "classroom_student"
          ).find_by("local_id IN (?)", Enrollment.where(user_id: submission.user_id).select(:id))

          unless student_mapping
            sync_run.log_warn("No student mapping for user #{submission.user_id}", entity_type: "Submission", entity_id: submission.id)
            next
          end

          classroom_sub = classroom_submissions.find { |cs| cs.user_id == student_mapping.external_id }
          unless classroom_sub
            sync_run.log_warn("No classroom submission for student #{student_mapping.external_id}", entity_type: "Submission", entity_id: submission.id)
            next
          end

          classroom_service.update_student_submission_grade(
            course_mapping.external_id,
            coursework_mapping.external_id,
            classroom_sub.id,
            submission.grade
          )

          sync_run.log_info("Pushed grade", entity_type: "Submission", entity_id: submission.id, external_id: classroom_sub.id)
          sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        rescue => e
          sync_run.update!(records_failed: sync_run.records_failed + 1)
          sync_run.log_error("Failed to push grade: #{e.message}", entity_type: "Submission", entity_id: submission.id)
        end
      end

      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end
end
