class CreateCourseFolderJob < ApplicationJob
  queue_as :default

  def perform(course_id, user_id = nil)
    course = Course.find(course_id)
    user = resolve_drive_user(course, user_id)
    return unless user&.google_connected?

    Current.tenant = course.tenant

    drive = GoogleDriveService.new(user)
    root = drive.create_folder(course.name)
    assignments = drive.create_folder("Assignments", parent_id: root[:id])
    resources = drive.create_folder("Resources", parent_id: root[:id])
    student_work = drive.create_folder("Student Work", parent_id: root[:id])

    course.update!(
      settings: course.settings.to_h.merge(
        "drive_folder_id" => root[:id],
        "drive_subfolders" => {
          "assignments" => assignments[:id],
          "resources" => resources[:id],
          "student_work" => student_work[:id]
        }
      )
    )
  ensure
    Current.tenant = nil
  end

  private

  def resolve_drive_user(course, user_id)
    user = User.find_by(id: user_id) if user_id.present?
    return user if user.present?

    User.joins(:roles)
        .where(roles: { name: %w[admin curriculum_lead teacher] }, tenant_id: course.tenant_id)
        .where.not(google_refresh_token: nil)
        .order(:id)
        .first
  end
end
