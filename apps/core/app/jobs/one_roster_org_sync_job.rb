class OneRosterOrgSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = triggered_by_id ? User.find(triggered_by_id) : nil

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_org_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    begin
      client = config.one_roster_client

      sync_orgs(client, config, sync_run)
      sync_academic_sessions(client, config, sync_run)

      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end

  private

  def sync_orgs(client, config, sync_run)
    orgs = client.get_all_orgs
    schools = orgs.select { |o| o["type"] == "school" }

    processed = 0
    succeeded = 0
    failed = 0

    schools.each do |org|
      processed += 1
      begin
        mapping = SyncMapping.find_external(config, "oneroster_org", org["sourcedId"])

        if mapping
          school = School.find(mapping.local_id)
          school.update!(name: org["name"]) if school.name != org["name"]
          mapping.update!(last_synced_at: Time.current)
          sync_run.log_info("Updated school", entity_type: "School", entity_id: school.id, external_id: org["sourcedId"])
        else
          school = School.create!(
            name: org["name"],
            tenant: config.tenant,
            timezone: "America/New_York"
          )
          SyncMapping.create!(
            tenant: config.tenant,
            integration_config: config,
            local_type: "School",
            local_id: school.id,
            external_id: org["sourcedId"],
            external_type: "oneroster_org",
            last_synced_at: Time.current
          )
          sync_run.log_info("Created school", entity_type: "School", entity_id: school.id, external_id: org["sourcedId"])
        end

        succeeded += 1
      rescue => e
        failed += 1
        sync_run.log_error("Failed to sync org: #{e.message}", external_id: org["sourcedId"])
      end
    end

    sync_run.update!(
      records_processed: sync_run.records_processed + processed,
      records_succeeded: sync_run.records_succeeded + succeeded,
      records_failed: sync_run.records_failed + failed
    )
  end

  def sync_academic_sessions(client, config, sync_run)
    sessions = client.get_all_academic_sessions

    processed = 0
    succeeded = 0
    failed = 0

    sessions.each do |session|
      processed += 1
      begin
        session_type = session["type"]

        if session_type == "schoolYear"
          sync_academic_year(session, config, sync_run)
        elsif %w[term semester gradingPeriod].include?(session_type)
          sync_term(session, config, sync_run)
        else
          sync_run.log_warn("Unknown session type: #{session_type}", external_id: session["sourcedId"])
          next
        end

        succeeded += 1
      rescue => e
        failed += 1
        sync_run.log_error("Failed to sync academic session: #{e.message}", external_id: session["sourcedId"])
      end
    end

    sync_run.update!(
      records_processed: sync_run.records_processed + processed,
      records_succeeded: sync_run.records_succeeded + succeeded,
      records_failed: sync_run.records_failed + failed
    )
  end

  def sync_academic_year(session, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", session["sourcedId"])

    start_date = Date.parse(session["startDate"])
    end_date = Date.parse(session["endDate"])

    if mapping
      academic_year = AcademicYear.find(mapping.local_id)
      academic_year.update!(name: session["title"], start_date: start_date, end_date: end_date)
      mapping.update!(last_synced_at: Time.current)
      sync_run.log_info("Updated academic year", entity_type: "AcademicYear", entity_id: academic_year.id, external_id: session["sourcedId"])
    else
      academic_year = AcademicYear.create!(
        name: session["title"],
        start_date: start_date,
        end_date: end_date,
        tenant: config.tenant
      )
      SyncMapping.create!(
        tenant: config.tenant,
        integration_config: config,
        local_type: "AcademicYear",
        local_id: academic_year.id,
        external_id: session["sourcedId"],
        external_type: "oneroster_academic_session",
        last_synced_at: Time.current
      )
      sync_run.log_info("Created academic year", entity_type: "AcademicYear", entity_id: academic_year.id, external_id: session["sourcedId"])
    end
  end

  def sync_term(session, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", session["sourcedId"])

    start_date = Date.parse(session["startDate"])
    end_date = Date.parse(session["endDate"])

    # Find parent academic year via parent sourcedId
    parent_id = session.dig("parent", "sourcedId")
    academic_year = find_academic_year(config, parent_id)

    if mapping
      term = Term.find(mapping.local_id)
      attrs = { name: session["title"], start_date: start_date, end_date: end_date }
      attrs[:academic_year] = academic_year if academic_year
      term.update!(attrs)
      mapping.update!(last_synced_at: Time.current)
      sync_run.log_info("Updated term", entity_type: "Term", entity_id: term.id, external_id: session["sourcedId"])
    else
      academic_year ||= AcademicYear.first
      unless academic_year
        academic_year = AcademicYear.create!(
          name: "Default Academic Year",
          start_date: start_date,
          end_date: end_date + 365,
          tenant: config.tenant
        )
      end

      term = Term.create!(
        name: session["title"],
        start_date: start_date,
        end_date: end_date,
        academic_year: academic_year,
        tenant: config.tenant
      )
      SyncMapping.create!(
        tenant: config.tenant,
        integration_config: config,
        local_type: "Term",
        local_id: term.id,
        external_id: session["sourcedId"],
        external_type: "oneroster_academic_session",
        last_synced_at: Time.current
      )
      sync_run.log_info("Created term", entity_type: "Term", entity_id: term.id, external_id: session["sourcedId"])
    end
  end

  def find_academic_year(config, parent_sourced_id)
    return nil unless parent_sourced_id

    parent_mapping = SyncMapping.find_external(config, "oneroster_academic_session", parent_sourced_id)
    return nil unless parent_mapping

    AcademicYear.find_by(id: parent_mapping.local_id)
  end
end
