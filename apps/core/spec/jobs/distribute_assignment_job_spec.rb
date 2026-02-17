require "rails_helper"

RSpec.describe DistributeAssignmentJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:teacher) do
    create(
      :user,
      tenant: tenant,
      first_name: "Taylor",
      last_name: "Teacher",
      email: "teacher@example.com",
      google_access_token: "access-token",
      google_refresh_token: "refresh-token",
      google_token_expires_at: 1.hour.from_now
    )
  end
  let(:student_one) { create(:user, tenant: tenant, first_name: "Ana", last_name: "Avery", email: "ana@example.com") }
  let(:student_two) { create(:user, tenant: tenant, first_name: "Ben", last_name: "Baker", email: "ben@example.com") }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, settings: { "drive_subfolders" => { "student_work" => "folder-student-work" } }) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:assignment) { create(:assignment, tenant: tenant, course: course, created_by: teacher, title: "Essay Draft") }
  let(:template_link) do
    create(
      :resource_link,
      tenant: tenant,
      linkable: assignment,
      provider: "google_drive",
      drive_file_id: "template-file-1",
      link_type: "template",
      url: "https://docs.google.com/document/d/template-file-1",
      title: "Essay Template",
      mime_type: "application/vnd.google-apps.document"
    )
  end
  let(:drive_service) { instance_double(GoogleDriveService) }

  before do
    Current.tenant = tenant
    teacher.add_role(:teacher)
    student_one.add_role(:student)
    student_two.add_role(:student)

    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: student_one, role: "student")
    create(:enrollment, tenant: tenant, section: section, user: student_two, role: "student")
    template_link

    allow(GoogleDriveService).to receive(:new).with(teacher).and_return(drive_service)
    allow(drive_service).to receive(:copy_file).and_return(
      {
        id: "copy-1",
        name: "Avery, Ana - Essay Draft",
        url: "https://docs.google.com/document/d/copy-1",
        mime_type: "application/vnd.google-apps.document"
      },
      {
        id: "copy-2",
        name: "Baker, Ben - Essay Draft",
        url: "https://docs.google.com/document/d/copy-2",
        mime_type: "application/vnd.google-apps.document"
      }
    )
    allow(drive_service).to receive(:share_file).and_return({ id: "perm-1" })
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "creates student Drive copies and resource links for enrolled students" do
    expect {
      described_class.perform_now(assignment.id)
    }.to change {
      assignment.resource_links.where(link_type: "student_copy").count
    }.by(2)

    copies = assignment.resource_links.where(link_type: "student_copy").order(:id)
    expect(copies.pluck(:drive_file_id)).to match_array(%w[copy-1 copy-2])
    expect(copies.map { |link| link.metadata["student_id"] }).to match_array([ student_one.id, student_two.id ])
    expect(drive_service).to have_received(:copy_file).with(
      "template-file-1",
      new_name: "Avery, Ana - Essay Draft",
      folder_id: "folder-student-work"
    )
    expect(drive_service).to have_received(:copy_file).with(
      "template-file-1",
      new_name: "Baker, Ben - Essay Draft",
      folder_id: "folder-student-work"
    )
    expect(drive_service).to have_received(:share_file).with("copy-1", email: "ana@example.com", role: "writer")
    expect(drive_service).to have_received(:share_file).with("copy-2", email: "ben@example.com", role: "writer")
  end

  it "is idempotent per student when rerun" do
    described_class.perform_now(assignment.id)

    expect {
      described_class.perform_now(assignment.id)
    }.not_to change {
      assignment.resource_links.where(link_type: "student_copy").count
    }
  end

  it "returns without copying when no template link exists" do
    template_link.destroy!

    described_class.perform_now(assignment.id)

    expect(GoogleDriveService).not_to have_received(:new)
    expect(assignment.resource_links.where(link_type: "student_copy")).to be_empty
  end
end
