require "zip"
require "csv"

class OneRosterCsvImportJob < ApplicationJob
  queue_as :default

  REQUIRED_FILES = %w[orgs.csv academicSessions.csv users.csv classes.csv enrollments.csv].freeze

  REQUIRED_HEADERS = {
    "orgs.csv" => %w[sourcedId status name type],
    "academicSessions.csv" => %w[sourcedId status title type startDate endDate],
    "users.csv" => %w[sourcedId status role givenName familyName email],
    "classes.csv" => %w[sourcedId status title classCode],
    "enrollments.csv" => %w[sourcedId status class user role]
  }.freeze

  ROLE_MAPPING = {
    "teacher" => "teacher",
    "student" => "student",
    "administrator" => "admin"
  }.freeze

  def perform(integration_config_id, blob_id, triggered_by_id = nil)
    config = IntegrationConfig.unscoped.find(integration_config_id)
    Current.tenant = config.tenant
    triggered_by = triggered_by_id ? User.find(triggered_by_id) : nil

    sync_run = SyncRun.create!(
      tenant: config.tenant,
      integration_config: config,
      sync_type: "oneroster_csv_import",
      direction: "pull",
      triggered_by: triggered_by
    )
    sync_run.start!

    begin
      blob = ActiveStorage::Blob.find(blob_id)
      csv_data = extract_csvs(blob, sync_run)

      # Process in dependency order
      process_orgs(csv_data["orgs.csv"], config, sync_run) if csv_data["orgs.csv"]
      process_academic_sessions(csv_data["academicSessions.csv"], config, sync_run) if csv_data["academicSessions.csv"]
      process_users(csv_data["users.csv"], config, sync_run) if csv_data["users.csv"]
      process_classes(csv_data["classes.csv"], config, sync_run) if csv_data["classes.csv"]
      process_enrollments(csv_data["enrollments.csv"], config, sync_run) if csv_data["enrollments.csv"]

      sync_run.complete!
    rescue => e
      sync_run.fail!(e.message)
      raise
    end
  end

  private

  def extract_csvs(blob, sync_run)
    csv_data = {}

    blob.open do |tempfile|
      Zip::File.open(tempfile.path) do |zip_file|
        REQUIRED_FILES.each do |filename|
          entry = zip_file.glob(filename).first || zip_file.glob("*/#{filename}").first
          if entry
            content = entry.get_input_stream.read
            parsed = CSV.parse(content, headers: true)
            validate_headers!(filename, parsed.headers, sync_run)
            csv_data[filename] = parsed
          else
            sync_run.log_warn("Missing CSV file: #{filename}")
          end
        end
      end
    end

    csv_data
  end

  def validate_headers!(filename, headers, sync_run)
    required = REQUIRED_HEADERS[filename] || []
    missing = required - headers
    if missing.any?
      sync_run.log_warn("Missing headers in #{filename}: #{missing.join(', ')}")
    end
  end

  def process_orgs(csv, config, sync_run)
    csv.each do |row|
      next if row["status"] == "tobedeleted"
      next unless row["type"] == "school"

      sync_run.update!(records_processed: sync_run.records_processed + 1)
      begin
        mapping = SyncMapping.find_external(config, "oneroster_org", row["sourcedId"])

        if mapping
          school = School.find(mapping.local_id)
          school.update!(name: row["name"]) if school.name != row["name"]
          mapping.update!(last_synced_at: Time.current)
        else
          school = School.create!(name: row["name"], tenant: config.tenant, timezone: "America/New_York")
          SyncMapping.create!(
            tenant: config.tenant, integration_config: config,
            local_type: "School", local_id: school.id,
            external_id: row["sourcedId"], external_type: "oneroster_org",
            last_synced_at: Time.current
          )
        end
        sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        sync_run.log_info("Processed org: #{row['name']}", entity_type: "School", external_id: row["sourcedId"])
      rescue => e
        sync_run.update!(records_failed: sync_run.records_failed + 1)
        sync_run.log_error("Failed to process org: #{e.message}", external_id: row["sourcedId"])
      end
    end
  end

  def process_academic_sessions(csv, config, sync_run)
    csv.each do |row|
      next if row["status"] == "tobedeleted"

      sync_run.update!(records_processed: sync_run.records_processed + 1)
      begin
        if row["type"] == "schoolYear"
          process_school_year(row, config, sync_run)
        elsif %w[term semester gradingPeriod].include?(row["type"])
          process_term(row, config, sync_run)
        else
          sync_run.log_warn("Unknown session type: #{row['type']}", external_id: row["sourcedId"])
          next
        end
        sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
      rescue => e
        sync_run.update!(records_failed: sync_run.records_failed + 1)
        sync_run.log_error("Failed to process academic session: #{e.message}", external_id: row["sourcedId"])
      end
    end
  end

  def process_school_year(row, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", row["sourcedId"])
    start_date = Date.parse(row["startDate"])
    end_date = Date.parse(row["endDate"])

    if mapping
      ay = AcademicYear.find(mapping.local_id)
      ay.update!(name: row["title"], start_date: start_date, end_date: end_date)
      mapping.update!(last_synced_at: Time.current)
    else
      ay = AcademicYear.create!(name: row["title"], start_date: start_date, end_date: end_date, tenant: config.tenant)
      SyncMapping.create!(
        tenant: config.tenant, integration_config: config,
        local_type: "AcademicYear", local_id: ay.id,
        external_id: row["sourcedId"], external_type: "oneroster_academic_session",
        last_synced_at: Time.current
      )
    end
    sync_run.log_info("Processed academic year: #{row['title']}", entity_type: "AcademicYear", external_id: row["sourcedId"])
  end

  def process_term(row, config, sync_run)
    mapping = SyncMapping.find_external(config, "oneroster_academic_session", row["sourcedId"])
    start_date = Date.parse(row["startDate"])
    end_date = Date.parse(row["endDate"])

    parent_id = row["parent"]
    academic_year = find_academic_year(config, parent_id) || AcademicYear.first
    unless academic_year
      academic_year = AcademicYear.create!(
        name: "Default Academic Year",
        start_date: start_date, end_date: end_date + 365,
        tenant: config.tenant
      )
    end

    if mapping
      term = Term.find(mapping.local_id)
      term.update!(name: row["title"], start_date: start_date, end_date: end_date, academic_year: academic_year)
      mapping.update!(last_synced_at: Time.current)
    else
      term = Term.create!(
        name: row["title"], start_date: start_date, end_date: end_date,
        academic_year: academic_year, tenant: config.tenant
      )
      SyncMapping.create!(
        tenant: config.tenant, integration_config: config,
        local_type: "Term", local_id: term.id,
        external_id: row["sourcedId"], external_type: "oneroster_academic_session",
        last_synced_at: Time.current
      )
    end
    sync_run.log_info("Processed term: #{row['title']}", entity_type: "Term", external_id: row["sourcedId"])
  end

  def process_users(csv, config, sync_run)
    csv.each do |row|
      next if row["status"] == "tobedeleted"

      sync_run.update!(records_processed: sync_run.records_processed + 1)
      begin
        email = row["email"]
        unless email.present?
          sync_run.log_warn("Skipping user without email", external_id: row["sourcedId"])
          next
        end

        mapping = SyncMapping.find_external(config, "oneroster_user", row["sourcedId"])

        if mapping
          user = User.find(mapping.local_id)
          user.update!(first_name: row["givenName"], last_name: row["familyName"], email: email)
          mapping.update!(last_synced_at: Time.current)
        else
          user = User.find_by(email: email) || User.create!(
            first_name: row["givenName"], last_name: row["familyName"],
            email: email, tenant: config.tenant
          )
          SyncMapping.create!(
            tenant: config.tenant, integration_config: config,
            local_type: "User", local_id: user.id,
            external_id: row["sourcedId"], external_type: "oneroster_user",
            last_synced_at: Time.current
          )
        end

        local_role = ROLE_MAPPING[row["role"]]
        user.add_role(local_role) if local_role

        sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        sync_run.log_info("Processed user: #{email}", entity_type: "User", external_id: row["sourcedId"])
      rescue => e
        sync_run.update!(records_failed: sync_run.records_failed + 1)
        sync_run.log_error("Failed to process user: #{e.message}", external_id: row["sourcedId"])
      end
    end
  end

  def process_classes(csv, config, sync_run)
    csv.each do |row|
      next if row["status"] == "tobedeleted"

      sync_run.update!(records_processed: sync_run.records_processed + 1)
      begin
        mapping = SyncMapping.find_external(config, "oneroster_class", row["sourcedId"])

        academic_year = find_any_academic_year(config)

        if mapping
          course = Course.find(mapping.local_id)
          course.update!(name: row["title"], code: row["classCode"])
          mapping.update!(last_synced_at: Time.current)
        else
          course = Course.create!(
            name: row["title"], code: row["classCode"],
            academic_year: academic_year, tenant: config.tenant
          )
          SyncMapping.create!(
            tenant: config.tenant, integration_config: config,
            local_type: "Course", local_id: course.id,
            external_id: row["sourcedId"], external_type: "oneroster_class",
            last_synced_at: Time.current
          )
        end
        sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        sync_run.log_info("Processed class: #{row['title']}", entity_type: "Course", external_id: row["sourcedId"])
      rescue => e
        sync_run.update!(records_failed: sync_run.records_failed + 1)
        sync_run.log_error("Failed to process class: #{e.message}", external_id: row["sourcedId"])
      end
    end
  end

  def process_enrollments(csv, config, sync_run)
    csv.each do |row|
      next if row["status"] == "tobedeleted"

      sync_run.update!(records_processed: sync_run.records_processed + 1)
      begin
        user_mapping = SyncMapping.find_external(config, "oneroster_user", row["user"])
        class_mapping = SyncMapping.find_external(config, "oneroster_class", row["class"])

        unless user_mapping
          sync_run.log_warn("User not found for enrollment", external_id: row["sourcedId"])
          sync_run.update!(records_failed: sync_run.records_failed + 1)
          next
        end

        unless class_mapping
          sync_run.log_warn("Class not found for enrollment", external_id: row["sourcedId"])
          sync_run.update!(records_failed: sync_run.records_failed + 1)
          next
        end

        user = User.find(user_mapping.local_id)
        course = Course.find(class_mapping.local_id)
        enrollment_role = row["role"] == "teacher" ? "teacher" : "student"

        term = find_or_create_term(config, course)
        section = course.sections.first || Section.create!(
          name: "#{course.name} - Section 1",
          course: course, term: term, tenant: config.tenant
        )

        mapping = SyncMapping.find_external(config, "oneroster_enrollment", row["sourcedId"])

        if mapping
          enrollment = Enrollment.find(mapping.local_id)
          enrollment.update!(role: enrollment_role, section: section, user: user)
          mapping.update!(last_synced_at: Time.current)
        else
          existing = Enrollment.find_by(user: user, section: section)
          enrollment = existing || Enrollment.create!(
            user: user, section: section, role: enrollment_role, tenant: config.tenant
          )
          SyncMapping.create!(
            tenant: config.tenant, integration_config: config,
            local_type: "Enrollment", local_id: enrollment.id,
            external_id: row["sourcedId"], external_type: "oneroster_enrollment",
            last_synced_at: Time.current
          )
        end
        sync_run.update!(records_succeeded: sync_run.records_succeeded + 1)
        sync_run.log_info("Processed enrollment", entity_type: "Enrollment", external_id: row["sourcedId"])
      rescue => e
        sync_run.update!(records_failed: sync_run.records_failed + 1)
        sync_run.log_error("Failed to process enrollment: #{e.message}", external_id: row["sourcedId"])
      end
    end
  end

  def find_academic_year(config, parent_sourced_id)
    return nil unless parent_sourced_id.present?

    parent_mapping = SyncMapping.find_external(config, "oneroster_academic_session", parent_sourced_id)
    return nil unless parent_mapping

    AcademicYear.find_by(id: parent_mapping.local_id)
  end

  def find_any_academic_year(config)
    mapping = SyncMapping.where(integration_config: config, external_type: "oneroster_academic_session", local_type: "AcademicYear").first
    ay = mapping ? AcademicYear.find_by(id: mapping.local_id) : AcademicYear.first
    ay || AcademicYear.create!(
      name: "Default Academic Year",
      start_date: Date.new(Date.current.year, 8, 1),
      end_date: Date.new(Date.current.year + 1, 6, 30),
      tenant: Current.tenant
    )
  end

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
