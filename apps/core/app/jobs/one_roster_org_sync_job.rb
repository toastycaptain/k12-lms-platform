class OneRosterOrgSyncJob < ApplicationJob
  queue_as :default

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = User.unscoped.find_by(id: triggered_by_id, tenant_id: config.tenant_id) if triggered_by_id.present?

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_org_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    client = one_roster_client(config)
    sync_orgs(client, config, sync_run)
    sync_academic_sessions(client, config, sync_run)

    sync_run.complete!
  rescue StandardError => e
    sync_run&.fail!(e.message)
    raise
  ensure
    Current.tenant = nil
    Current.user = nil
  end

  private

  def one_roster_client(config)
    settings = config.settings.is_a?(Hash) ? config.settings : {}
    OneRosterClient.new(
      base_url: settings.fetch("base_url"),
      client_id: settings.fetch("client_id"),
      client_secret: settings.fetch("client_secret")
    )
  end

  def sync_orgs(client, config, sync_run)
    orgs = client.get_all_orgs
    schools = orgs.select { |org| org["type"].to_s.casecmp("school").zero? }

    schools.each do |org|
      process_record(sync_run, org["sourcedId"]) do
        mapping = SyncMapping.find_external(config, "oneroster_org", org["sourcedId"])
        school = mapping ? School.find_by(id: mapping.local_id) : nil
        school ||= School.new(tenant: config.tenant)

        school.name = org["name"].presence || "Imported School"
        school.timezone = org["identifier"].presence || "UTC"
        school.save!

        upsert_mapping!(
          config: config,
          local_type: "School",
          local_id: school.id,
          external_type: "oneroster_org",
          external_id: org["sourcedId"]
        )

        sync_run.log_info("Synced OneRoster school", entity_type: "School", entity_id: school.id, external_id: org["sourcedId"])
      end
    end
  end

  def sync_academic_sessions(client, config, sync_run)
    sessions = client.get_all_academic_sessions

    sessions.each do |session|
      process_record(sync_run, session["sourcedId"]) do
        session_type = session["type"].to_s.downcase
        case session_type
        when "schoolyear"
          sync_academic_year(session, config, sync_run)
        when "term", "semester", "gradingperiod"
          sync_term(session, config, sync_run)
        else
          sync_run.log_warn("Skipped unsupported OneRoster academic session type",
            metadata: { session_type: session["type"] }, external_id: session["sourcedId"])
        end
      end
    end
  end

  def sync_academic_year(session, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", session["sourcedId"])
    academic_year = mapping ? AcademicYear.find_by(id: mapping.local_id) : nil
    academic_year ||= AcademicYear.new(tenant: config.tenant)

    start_date = parsed_date(session["startDate"]) || Date.current
    end_date = parsed_date(session["endDate"]) || (start_date + 365)
    end_date = start_date + 1 if end_date <= start_date

    academic_year.assign_attributes(
      name: session["title"].presence || "Imported School Year",
      start_date: start_date,
      end_date: end_date
    )
    academic_year.save!

    upsert_mapping!(
      config: config,
      local_type: "AcademicYear",
      local_id: academic_year.id,
      external_type: "oneroster_academic_session",
      external_id: session["sourcedId"]
    )

    sync_run.log_info("Synced OneRoster academic year", entity_type: "AcademicYear",
      entity_id: academic_year.id, external_id: session["sourcedId"])
  end

  def sync_term(session, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", session["sourcedId"])
    term = mapping ? Term.find_by(id: mapping.local_id) : nil
    term ||= Term.new(tenant: config.tenant)

    start_date = parsed_date(session["startDate"]) || Date.current
    end_date = parsed_date(session["endDate"]) || (start_date + 120)
    end_date = start_date + 1 if end_date <= start_date

    parent_year = parent_academic_year(config, session)
    parent_year ||= AcademicYear.where(tenant: config.tenant).order(:start_date).last
    parent_year ||= AcademicYear.create!(
      tenant: config.tenant,
      name: "Imported Academic Year",
      start_date: start_date,
      end_date: end_date + 180
    )

    term.assign_attributes(
      academic_year: parent_year,
      name: session["title"].presence || "Imported Term",
      start_date: start_date,
      end_date: end_date
    )
    term.save!

    upsert_mapping!(
      config: config,
      local_type: "Term",
      local_id: term.id,
      external_type: "oneroster_academic_session",
      external_id: session["sourcedId"]
    )

    sync_run.log_info("Synced OneRoster term", entity_type: "Term", entity_id: term.id, external_id: session["sourcedId"])
  end

  def parent_academic_year(config, session)
    parent_id = session.dig("parent", "sourcedId")
    return nil if parent_id.blank?

    parent_mapping = SyncMapping.find_external(config, "oneroster_academic_session", parent_id)
    return nil unless parent_mapping

    AcademicYear.find_by(id: parent_mapping.local_id)
  end

  def process_record(sync_run, external_id)
    sync_run.increment!(:records_processed)
    yield
    sync_run.increment!(:records_succeeded)
  rescue StandardError => e
    sync_run.increment!(:records_failed)
    sync_run.log_error("OneRoster org sync error: #{e.message}", external_id: external_id)
  end

  def upsert_mapping!(config:, local_type:, local_id:, external_type:, external_id:)
    mapping = SyncMapping.find_external(config, external_type, external_id)
    if mapping
      mapping.update!(local_type: local_type, local_id: local_id, last_synced_at: Time.current)
    else
      SyncMapping.create!(
        tenant: config.tenant,
        integration_config: config,
        local_type: local_type,
        local_id: local_id,
        external_type: external_type,
        external_id: external_id,
        last_synced_at: Time.current
      )
    end
  end

  def parsed_date(raw_date)
    return nil if raw_date.blank?

    Date.parse(raw_date.to_s)
  rescue ArgumentError
    nil
  end
end
