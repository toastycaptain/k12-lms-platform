class DistributeAssignmentJob < ApplicationJob
  queue_as :default

  def perform(assignment_id)
    assignment = Assignment.includes(:resource_links, :course, :created_by).find(assignment_id)
    template_link = assignment.resource_links.find_by(provider: "google_drive", link_type: "template")
    return unless template_link&.drive_file_id.present?

    teacher = resolve_drive_user(assignment)
    return unless teacher&.google_connected?

    Current.tenant = assignment.tenant
    drive = GoogleDriveService.new(teacher)
    student_work_folder_id = assignment.course.settings.to_h.dig("drive_subfolders", "student_work")

    students_for_course(assignment.course_id).find_each do |student|
      distribute_to_student(drive, assignment, template_link, student, student_work_folder_id)
    end
  ensure
    Current.tenant = nil
  end

  private

  def resolve_drive_user(assignment)
    return assignment.created_by if assignment.created_by&.google_connected?

    User.joins(enrollments: :section)
        .where(enrollments: { role: "teacher" }, sections: { course_id: assignment.course_id })
        .where.not(google_refresh_token: nil)
        .order(:id)
        .first ||
      User.joins(:roles)
          .where(roles: { name: "admin" })
          .where.not(google_refresh_token: nil)
          .order(:id)
          .first
  end

  def students_for_course(course_id)
    User.joins(enrollments: :section)
        .where(enrollments: { role: "student" }, sections: { course_id: course_id })
        .where.not(email: [ nil, "" ])
        .distinct
  end

  def distribute_to_student(drive, assignment, template_link, student, folder_id)
    return if student_copy_exists?(assignment, student.id)

    copy = drive.copy_file(
      template_link.drive_file_id,
      new_name: "#{student.last_name}, #{student.first_name} - #{assignment.title}",
      folder_id: folder_id
    )
    drive.share_file(copy[:id], email: student.email, role: "writer")

    ResourceLink.create!(
      tenant: assignment.tenant,
      linkable: assignment,
      url: copy[:url],
      title: copy[:name],
      provider: "google_drive",
      drive_file_id: copy[:id],
      mime_type: copy[:mime_type],
      link_type: "student_copy",
      metadata: {
        "student_id" => student.id,
        "template_file_id" => template_link.drive_file_id,
        "source_resource_link_id" => template_link.id
      }
    )
  rescue GoogleApiError => e
    Rails.logger.warn("drive.distribute_assignment_failed assignment_id=#{assignment.id} student_id=#{student.id} #{e.message}")
  end

  def student_copy_exists?(assignment, student_id)
    assignment.resource_links
              .where(link_type: "student_copy")
              .where("metadata ->> 'student_id' = ?", student_id.to_s)
              .exists?
  end
end
