class GradebookExportJob < ApplicationJob
  queue_as :default

  def perform(course_id, payload, requested_by_id = nil)
    course = Course.unscoped.find(course_id)
    Current.tenant = course.tenant
    requested_by = User.unscoped.find_by(id: requested_by_id, tenant_id: course.tenant_id) if requested_by_id.present?

    csv_data = GradebookExportService.new(course: course, payload: payload.deep_symbolize_keys).call
    course.gradebook_export.attach(
      io: StringIO.new(csv_data),
      filename: "gradebook-#{course.id}-#{Date.current}.csv",
      content_type: "text/csv"
    )

    AuditLogger.log(
      event_type: "gradebook.export_async.completed",
      actor: requested_by,
      auditable: course,
      metadata: {
        course_id: course.id,
        requested_by_id: requested_by&.id
      }
    )
  ensure
    Current.tenant = nil
    Current.user = nil
  end
end
