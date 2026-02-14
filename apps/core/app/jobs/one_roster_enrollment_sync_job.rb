class OneRosterEnrollmentSyncJob < ApplicationJob
  queue_as :default

  ROLE_MAPPING = {
    "teacher" => "teacher",
    "student" => "student",
    "administrator" => "teacher"
  }.freeze

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = triggered_by_id ? User.find(triggered_by_id) : nil

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_enrollment_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    begin
      client = config.one_roster_client

      enrollments = client.get_all_enrollments

      processed = 0
      succeeded = 0
      failed = 0

      enrollments.each do |or_enrollment|
        processed += 1
        begin
          user_sourced_id = or_enrollment.dig("user", "sourcedId")
          class_sourced_id = or_enrollment.dig("class", "sourcedId")

          user_mapping = SyncMapping.find_external(config, "oneroster_user", user_sourced_id)
          class_mapping = SyncMapping.find_external(config, "oneroster_class", class_sourced_id)

          unless user_mapping
            sync_run.log_warn("User not found for enrollment", external_id: or_enrollment["sourcedId"])
            failed += 1
            next
          end

          unless class_mapping
            sync_run.log_warn("Class not found for enrollment", external_id: or_enrollment["sourcedId"])
            failed += 1
            next
          end

          user = User.find(user_mapping.local_id)
          course = Course.find(class_mapping.local_id)
          role = ROLE_MAPPING[or_enrollment["role"]] || "student"

          # Find or create section for this course
          term = find_or_create_term(config, course)
          section = course.sections.first || Section.create!(
            name: "#{course.name} - Section 1",
            course: course,
            term: term,
            tenant: config.tenant
          )

          mapping = SyncMapping.find_external(config, "oneroster_enrollment", or_enrollment["sourcedId"])

          if mapping
            enrollment = Enrollment.find(mapping.local_id)
            enrollment.update!(role: role, section: section, user: user)
            mapping.update!(last_synced_at: Time.current)
            sync_run.log_info("Updated enrollment", entity_type: "Enrollment", entity_id: enrollment.id, external_id: or_enrollment["sourcedId"])
          else
            existing = Enrollment.find_by(user: user, section: section)
            enrollment = existing || Enrollment.create!(
              user: user,
              section: section,
              role: role,
              tenant: config.tenant
            )
            SyncMapping.create!(
              tenant: config.tenant,
              integration_config: config,
              local_type: "Enrollment",
              local_id: enrollment.id,
              external_id: or_enrollment["sourcedId"],
              external_type: "oneroster_enrollment",
              last_synced_at: Time.current
            )
            sync_run.log_info("Created enrollment", entity_type: "Enrollment", entity_id: enrollment.id, external_id: or_enrollment["sourcedId"])
          end

          succeeded += 1
        rescue => e
          failed += 1
          sync_run.log_error("Failed to sync enrollment: #{e.message}", external_id: or_enrollment["sourcedId"])
        end
      end

      sync_run.update!(records_processed: processed, records_succeeded: succeeded, records_failed: failed)
      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end

  private

  def find_or_create_term(config, course)
    term = Term.first
    return term if term

    academic_year = course.academic_year
    Term.create!(
      name: "Default Term",
      start_date: academic_year.start_date,
      end_date: academic_year.end_date,
      academic_year: academic_year,
      tenant: config.tenant
    )
  end
end
