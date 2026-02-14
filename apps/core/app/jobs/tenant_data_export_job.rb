class TenantDataExportJob < ApplicationJob
  queue_as :default

  EXPORT_MODELS = {
    "users" => User,
    "courses" => Course,
    "unit_plans" => UnitPlan,
    "lesson_plans" => LessonPlan,
    "assignments" => Assignment,
    "submissions" => Submission,
    "questions" => Question,
    "quizzes" => Quiz,
    "standards" => Standard,
    "enrollments" => Enrollment
  }.freeze

  SENSITIVE_FIELDS = %w[
    api_key api_secret google_access_token google_refresh_token
    encrypted_api_key encrypted_api_secret password_digest
  ].freeze

  def perform(tenant_id)
    tenant = Tenant.find(tenant_id)
    Current.tenant = tenant

    zip_buffer = create_zip(tenant)

    tenant.data_export.attach(
      io: StringIO.new(zip_buffer),
      filename: "tenant_export_#{tenant.slug}_#{Time.current.strftime('%Y%m%d%H%M%S')}.zip",
      content_type: "application/zip"
    )
  ensure
    Current.tenant = nil
  end

  private

  def create_zip(tenant)
    require "zip"

    buffer = StringIO.new
    record_counts = {}

    Zip::OutputStream.write_buffer(buffer) do |zos|
      EXPORT_MODELS.each do |name, klass|
        zos.put_next_entry("#{name}.json")
        count = 0
        zos.write("[\n")
        first = true
        klass.find_each(batch_size: 500) do |record|
          zos.write(",\n") unless first
          first = false
          zos.write(JSON.pretty_generate(sanitize_record(record)))
          count += 1
        end
        zos.write("\n]")
        record_counts[name] = count
      end

      metadata = {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        exported_at: Time.current.iso8601,
        record_counts: record_counts
      }
      zos.put_next_entry("metadata.json")
      zos.write(JSON.pretty_generate(metadata))
    end

    buffer.rewind
    buffer.read
  end

  def sanitize_record(record)
    attrs = record.attributes
    SENSITIVE_FIELDS.each { |f| attrs.delete(f) }
    attrs
  end
end
