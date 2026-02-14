class OneRosterClassSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = triggered_by_id ? User.find(triggered_by_id) : nil

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_class_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    begin
      client = config.one_roster_client

      classes = client.get_all_classes

      processed = 0
      succeeded = 0
      failed = 0

      classes.each do |or_class|
        processed += 1
        begin
          mapping = SyncMapping.find_external(config, "oneroster_class", or_class["sourcedId"])

          academic_year = find_academic_year(config) || create_default_academic_year(config)

          if mapping
            course = Course.find(mapping.local_id)
            course.update!(
              name: or_class["title"],
              code: or_class["classCode"]
            )
            mapping.update!(last_synced_at: Time.current)
            sync_run.log_info("Updated course", entity_type: "Course", entity_id: course.id, external_id: or_class["sourcedId"])
          else
            course = Course.create!(
              name: or_class["title"],
              code: or_class["classCode"],
              academic_year: academic_year,
              tenant: config.tenant
            )
            SyncMapping.create!(
              tenant: config.tenant,
              integration_config: config,
              local_type: "Course",
              local_id: course.id,
              external_id: or_class["sourcedId"],
              external_type: "oneroster_class",
              last_synced_at: Time.current
            )
            sync_run.log_info("Created course", entity_type: "Course", entity_id: course.id, external_id: or_class["sourcedId"])
          end

          succeeded += 1
        rescue => e
          failed += 1
          sync_run.log_error("Failed to sync class: #{e.message}", external_id: or_class["sourcedId"])
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

  def find_academic_year(config)
    # First try to find via sync mapping
    mapping = SyncMapping.where(integration_config: config, external_type: "oneroster_academic_session", local_type: "AcademicYear").first
    mapping ? AcademicYear.find_by(id: mapping.local_id) : AcademicYear.first
  end

  def create_default_academic_year(config)
    AcademicYear.create!(
      name: "Default Academic Year",
      start_date: Date.new(Date.current.year, 8, 1),
      end_date: Date.new(Date.current.year + 1, 6, 30),
      tenant: config.tenant
    )
  end
end
