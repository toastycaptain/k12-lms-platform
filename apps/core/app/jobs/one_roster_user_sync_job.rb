class OneRosterUserSyncJob < ApplicationJob
  queue_as :default

  ROLE_MAPPING = {
    "teacher" => "teacher",
    "student" => "student",
    "administrator" => "admin"
  }.freeze

  ENROLLMENT_ROLE_MAPPING = {
    "teacher" => "teacher",
    "student" => "student"
  }.freeze

  def perform(integration_config_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = User.unscoped.find_by(id: triggered_by_id, tenant_id: config.tenant_id) if triggered_by_id.present?

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_user_sync",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    client = one_roster_client(config)
    sync_users(client, config, sync_run)
    sync_classes(client, config, sync_run)
    sync_enrollments(client, config, sync_run)

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

  def sync_users(client, config, sync_run)
    users = client.get_all_users

    users.each do |one_roster_user|
      process_record(sync_run, one_roster_user["sourcedId"]) do
        email = one_roster_user["email"].presence
        raise "OneRoster user missing email" if email.blank?

        mapping = SyncMapping.find_external(config, "oneroster_user", one_roster_user["sourcedId"])
        user = mapping ? User.unscoped.find_by(id: mapping.local_id, tenant_id: config.tenant_id) : nil
        user ||= User.unscoped.find_by(email: email, tenant_id: config.tenant_id)
        user ||= User.unscoped.new(tenant: config.tenant, email: email)

        user.first_name = one_roster_user["givenName"].presence || user.first_name || "First"
        user.last_name = one_roster_user["familyName"].presence || user.last_name || "Last"
        user.email = email
        user.save!

        mapped_role = ROLE_MAPPING[one_roster_user["role"].to_s.downcase]
        user.add_role(mapped_role) if mapped_role.present?

        upsert_mapping!(
          config: config,
          local_type: "User",
          local_id: user.id,
          external_type: "oneroster_user",
          external_id: one_roster_user["sourcedId"]
        )

        sync_run.log_info("Synced OneRoster user", entity_type: "User", entity_id: user.id, external_id: one_roster_user["sourcedId"])
      end
    end
  end

  def sync_classes(client, config, sync_run)
    classes = client.get_all_classes

    classes.each do |klass|
      process_record(sync_run, klass["sourcedId"]) do
        term = resolve_term(config, klass)
        academic_year = term.academic_year

        course_name = klass["title"].presence || klass["classCode"].presence || "Imported Course"
        course = Course.where(tenant: config.tenant, academic_year: academic_year, name: course_name).first_or_create!

        section_mapping = SyncMapping.find_external(config, "oneroster_class", klass["sourcedId"])
        section = section_mapping ? Section.find_by(id: section_mapping.local_id, tenant_id: config.tenant_id) : nil
        section ||= Section.new(tenant: config.tenant)
        section.assign_attributes(
          course: course,
          term: term,
          name: klass["title"].presence || klass["classCode"].presence || "Imported Section"
        )
        section.save!

        upsert_mapping!(
          config: config,
          local_type: "Section",
          local_id: section.id,
          external_type: "oneroster_class",
          external_id: klass["sourcedId"]
        )

        sync_run.log_info("Synced OneRoster class", entity_type: "Section", entity_id: section.id, external_id: klass["sourcedId"])
      end
    end
  end

  def sync_enrollments(client, config, sync_run)
    enrollments = client.get_all_enrollments

    enrollments.each do |one_roster_enrollment|
      process_record(sync_run, one_roster_enrollment["sourcedId"]) do
        role = ENROLLMENT_ROLE_MAPPING[one_roster_enrollment["role"].to_s.downcase]
        raise "Unsupported enrollment role" if role.blank?

        user_mapping = SyncMapping.find_external(config, "oneroster_user", one_roster_enrollment.dig("user", "sourcedId"))
        section_mapping = SyncMapping.find_external(config, "oneroster_class", one_roster_enrollment.dig("class", "sourcedId"))
        raise "Missing mapped user" unless user_mapping
        raise "Missing mapped class" unless section_mapping

        user = User.unscoped.find(user_mapping.local_id)
        section = Section.find(section_mapping.local_id)

        enrollment = Enrollment.find_or_initialize_by(tenant: config.tenant, user: user, section: section)
        enrollment.role = role
        enrollment.save!

        upsert_mapping!(
          config: config,
          local_type: "Enrollment",
          local_id: enrollment.id,
          external_type: "oneroster_enrollment",
          external_id: one_roster_enrollment["sourcedId"]
        )

        sync_run.log_info("Synced OneRoster enrollment", entity_type: "Enrollment", entity_id: enrollment.id, external_id: one_roster_enrollment["sourcedId"])
      end
    end
  end

  def resolve_term(config, klass)
    term_sourced_id = klass.dig("term", "sourcedId")
    if term_sourced_id.present?
      term_mapping = SyncMapping.find_external(config, "oneroster_academic_session", term_sourced_id)
      term = Term.find_by(id: term_mapping&.local_id, tenant_id: config.tenant_id)
      return term if term
    end

    term = Term.where(tenant: config.tenant).order(:start_date).last
    return term if term

    academic_year = AcademicYear.where(tenant: config.tenant).order(:start_date).last
    academic_year ||= AcademicYear.create!(
      tenant: config.tenant,
      name: "Imported Academic Year",
      start_date: Date.current.beginning_of_year,
      end_date: Date.current.end_of_year
    )

    Term.create!(
      tenant: config.tenant,
      academic_year: academic_year,
      name: "Imported Term",
      start_date: Date.current.beginning_of_year,
      end_date: Date.current.end_of_year
    )
  end

  def process_record(sync_run, external_id)
    sync_run.increment!(:records_processed)
    yield
    sync_run.increment!(:records_succeeded)
  rescue StandardError => e
    sync_run.increment!(:records_failed)
    sync_run.log_error("OneRoster user sync error: #{e.message}", external_id: external_id)
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
end
