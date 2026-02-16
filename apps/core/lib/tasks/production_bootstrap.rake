namespace :production do
  desc "Bootstrap production with initial tenant, admin user, school, and academic year"
  task bootstrap: :environment do
    admin_email = ENV.fetch("ADMIN_EMAIL") do
      abort "ERROR: ADMIN_EMAIL environment variable is required. Set it and re-run."
    end

    tenant_slug = ENV.fetch("DEFAULT_TENANT_SLUG", "default")

    ActiveRecord::Base.transaction do
      tenant = Tenant.find_or_create_by!(slug: tenant_slug) do |record|
        record.name = tenant_slug.titleize
        record.settings = {}
      end
      Current.tenant = tenant

      admin = User.find_or_create_by!(email: admin_email, tenant: tenant) do |record|
        record.first_name = "Admin"
        record.last_name = "User"
      end
      admin.add_role(:admin)

      school = School.find_or_create_by!(name: "Default School", tenant: tenant) do |record|
        record.address = ""
        record.timezone = "America/Chicago"
      end

      current_year = Date.current.year
      year_name = "#{current_year}-#{current_year + 1}"
      academic_year = AcademicYear.find_or_create_by!(name: year_name, tenant: tenant) do |record|
        record.start_date = Date.new(current_year, 8, 1)
        record.end_date = Date.new(current_year + 1, 6, 30)
        record.current = true
      end

      term = Term.find_or_create_by!(
        name: "Full Year #{year_name}",
        tenant: tenant,
        academic_year: academic_year,
      ) do |record|
        record.start_date = academic_year.start_date
        record.end_date = academic_year.end_date
      end

      AuditLog.create!(
        event_type: "system.bootstrap",
        metadata: {
          version: `git rev-parse --short HEAD 2>/dev/null`.strip.presence || "unknown",
          timestamp: Time.current.iso8601,
          admin_email: admin_email,
          tenant_slug: tenant_slug
        },
        actor: admin,
        auditable: tenant,
        tenant: tenant,
      )

      puts ""
      puts "=== Production Bootstrap Complete ==="
      puts "  Tenant:        #{tenant.name} (#{tenant.slug}) [#{tenant.previously_new_record? ? 'created' : 'found'}]"
      puts "  Admin:         #{admin.email} [#{admin.previously_new_record? ? 'created' : 'found'}]"
      puts "  Admin roles:   #{admin.roles.pluck(:name).join(', ')}"
      puts "  School:        #{school.name} [#{school.previously_new_record? ? 'created' : 'found'}]"
      puts "  Academic Year: #{academic_year.name} [#{academic_year.previously_new_record? ? 'created' : 'found'}]"
      puts "  Term:          #{term.name} [#{term.previously_new_record? ? 'created' : 'found'}]"
      puts "  Audit log:     system.bootstrap entry recorded"
      puts "====================================="
      puts ""
    ensure
      Current.tenant = nil
    end
  end

  desc "Check that all migrations have been applied; exit 1 if any are pending"
  task check_migrations: :environment do
    context =
      if ActiveRecord::Base.connection_pool.respond_to?(:migration_context)
        ActiveRecord::Base.connection_pool.migration_context
      else
        ActiveRecord::Base.connection.migration_context
      end
    applied_versions = context.get_all_versions
    pending = context.migrations.reject { |migration| applied_versions.include?(migration.version) }

    if pending.empty?
      puts "All #{applied_versions.size} migrations have been applied."
      exit 0
    else
      puts "ERROR: #{pending.size} pending migration(s):"
      pending.each do |migration|
        puts "  - #{migration.version} #{migration.name}"
      end
      puts ""
      puts "Run 'rails db:migrate' to apply them."
      exit 1
    end
  end

  desc "Generate the 3 Active Record Encryption keys (output only, does not write to ENV)"
  task generate_encryption_keys: :environment do
    require "securerandom"

    puts ""
    puts "=== Active Record Encryption Keys ==="
    puts ""
    puts "Add these to your Railway environment variables (or .env file):"
    puts ""
    puts "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=#{SecureRandom.hex(32)}"
    puts "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=#{SecureRandom.hex(32)}"
    puts "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=#{SecureRandom.hex(32)}"
    puts ""
    puts "WARNING: Store these securely. If you lose them, encrypted data cannot be decrypted."
    puts "WARNING: Do not commit these values to version control."
    puts "====================================="
    puts ""
  end
end
