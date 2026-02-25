require "csv"

class DataImportService
  class ImportError < StandardError; end

  VALID_IMPORT_TYPES = %w[users courses enrollments].freeze

  def initialize(tenant, import_type:, csv_content:, imported_by:)
    @tenant = tenant
    @import_type = import_type
    @csv_content = csv_content
    @imported_by = imported_by
    @results = { created: 0, updated: 0, skipped: 0, errors: [] }
  end

  def call
    validate_import_type!
    Current.tenant = @tenant
    rows = CSV.parse(@csv_content, headers: true, liberal_parsing: true)

    case @import_type
    when "users" then import_users(rows)
    when "courses" then import_courses(rows)
    when "enrollments" then import_enrollments(rows)
    end

    @results
  ensure
    Current.tenant = nil
  end

  private

  def validate_import_type!
    return if VALID_IMPORT_TYPES.include?(@import_type)

    raise ImportError, "Invalid import type: #{@import_type}. Valid types: #{VALID_IMPORT_TYPES.join(', ')}"
  end

  def import_users(rows)
    rows.each_with_index do |row, index|
      email = row["email"]&.strip
      unless email.present? && email.match?(URI::MailTo::EMAIL_REGEXP)
        @results[:errors] << { row: index + 2, error: "Invalid or missing email" }
        next
      end

      role_name = (row["role"]&.strip&.downcase || "student")
      unless Role::VALID_ROLES.include?(role_name)
        @results[:errors] << { row: index + 2, error: "Invalid role: #{role_name}" }
        next
      end

      user = User.find_by(email: email, tenant: @tenant)
      if user
        user.update!(
          first_name: row["first_name"]&.strip.presence || user.first_name,
          last_name: row["last_name"]&.strip.presence || user.last_name
        )
        user.add_role(role_name) unless user.has_role?(role_name)
        @results[:updated] += 1
      else
        user = User.create!(
          tenant: @tenant,
          email: email,
          first_name: row["first_name"]&.strip.presence || "Imported",
          last_name: row["last_name"]&.strip.presence || "User"
        )
        user.add_role(role_name)
        @results[:created] += 1
      end
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end

  def import_courses(rows)
    academic_year = AcademicYear.order(start_date: :desc).first
    unless academic_year
      @results[:errors] << { row: 0, error: "No academic year found for tenant. Create one first." }
      return
    end

    rows.each_with_index do |row, index|
      name = row["name"]&.strip
      if name.blank?
        @results[:errors] << { row: index + 2, error: "Missing course name" }
        next
      end

      course = Course.find_or_initialize_by(
        tenant: @tenant,
        academic_year: academic_year,
        name: name
      )
      course.description = row["description"]&.strip if row["description"].present?
      was_new = course.new_record?
      course.save!
      @results[was_new ? :created : :updated] += 1

      if row["section_name"].present?
        Section.find_or_create_by!(
          tenant: @tenant,
          course: course,
          term: Term.where(tenant: @tenant).order(start_date: :asc).first || create_default_term(academic_year),
          name: row["section_name"].strip
        )
      end
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end

  def import_enrollments(rows)
    rows.each_with_index do |row, index|
      email = row["email"]&.strip
      section_name = row["section_name"]&.strip
      role = (row["role"]&.strip&.downcase || "student")

      user = User.find_by(email: email, tenant: @tenant)
      section = Section.find_by(name: section_name, tenant: @tenant)
      unless user && section
        @results[:errors] << { row: index + 2, error: "Missing user or section for enrollment" }
        next
      end

      enrollment = Enrollment.find_or_initialize_by(tenant: @tenant, user: user, section: section)
      enrollment.role = role
      was_new = enrollment.new_record?
      enrollment.save!
      @results[was_new ? :created : :updated] += 1
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end

  def create_default_term(academic_year)
    Term.create!(
      tenant: @tenant,
      academic_year: academic_year,
      name: "Default Term",
      start_date: academic_year.start_date,
      end_date: academic_year.end_date
    )
  end
end
