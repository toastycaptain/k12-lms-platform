require "rails_helper"

RSpec.describe CreateCourseFolderJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:user) do
    create(
      :user,
      tenant: tenant,
      google_access_token: "access-token",
      google_refresh_token: "refresh-token",
      google_token_expires_at: 1.hour.from_now
    )
  end
  let(:drive_service) { instance_double(GoogleDriveService) }

  before do
    Current.tenant = tenant
    user.add_role(:teacher)

    allow(GoogleDriveService).to receive(:new).with(user).and_return(drive_service)
    allow(drive_service).to receive(:create_folder).with(course.name)
      .and_return({ id: "folder-root", name: course.name })
    allow(drive_service).to receive(:create_folder).with("Assignments", parent_id: "folder-root")
      .and_return({ id: "folder-assignments", name: "Assignments" })
    allow(drive_service).to receive(:create_folder).with("Resources", parent_id: "folder-root")
      .and_return({ id: "folder-resources", name: "Resources" })
    allow(drive_service).to receive(:create_folder).with("Student Work", parent_id: "folder-root")
      .and_return({ id: "folder-student-work", name: "Student Work" })
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "creates course and subfolders and persists IDs in course settings" do
    described_class.perform_now(course.id, user.id)

    settings = course.reload.settings
    expect(settings["drive_folder_id"]).to eq("folder-root")
    expect(settings["drive_subfolders"]).to eq({
      "assignments" => "folder-assignments",
      "resources" => "folder-resources",
      "student_work" => "folder-student-work"
    })
  end

  it "does nothing when the selected user is not google-connected" do
    user.update!(google_refresh_token: nil)

    described_class.perform_now(course.id, user.id)

    expect(GoogleDriveService).not_to have_received(:new)
    expect(course.reload.settings).to eq({})
  end
end
