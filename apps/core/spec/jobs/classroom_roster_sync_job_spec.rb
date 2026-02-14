require "rails_helper"

RSpec.describe ClassroomRosterSyncJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant, google_refresh_token: "test-refresh-token")
    u.add_role(:admin)
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let(:config) do
    create(:integration_config, tenant: tenant, created_by: user, status: "active",
      settings: { "domain" => "school.edu" })
  end
  let(:course_mapping) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: config,
      local_type: "Course",
      local_id: course.id,
      external_id: "gc_course_1",
      external_type: "classroom_course"
    )
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:student_profile) do
    double("Profile",
      email_address: "student1@school.edu",
      name: double("Name", given_name: "Jane", family_name: "Doe")
    )
  end
  let(:classroom_student) do
    double("Student", user_id: "student_123", profile: student_profile)
  end
  let(:classroom_service) { instance_double(GoogleClassroomService) }

  before do
    section # ensure created
    course_mapping # ensure created
    allow(GoogleClassroomService).to receive(:new).and_return(classroom_service)
    allow(classroom_service).to receive(:list_students).and_return([ classroom_student ])
  end

  it "creates a user, enrollment, and sync mapping" do
    expect {
      described_class.perform_now(config.id, user.id, course_mapping.id)
    }.to change(User, :count).by(1)
     .and change(Enrollment, :count).by(1)
     .and change(SyncMapping, :count).by(1)

    new_user = User.find_by(email: "student1@school.edu")
    expect(new_user).to be_present
    expect(new_user.first_name).to eq("Jane")
    expect(new_user.last_name).to eq("Doe")

    enrollment = Enrollment.find_by(user: new_user, section: section)
    expect(enrollment).to be_present
    expect(enrollment.role).to eq("student")
  end

  it "creates a completed sync run" do
    described_class.perform_now(config.id, user.id, course_mapping.id)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.sync_type).to eq("roster_sync")
    expect(sync_run.records_succeeded).to eq(1)
  end

  it "filters students by domain" do
    outside_profile = double("Profile",
      email_address: "student2@otherdomain.com",
      name: double("Name", given_name: "Bob", family_name: "Smith")
    )
    outside_student = double("Student", user_id: "student_456", profile: outside_profile)
    allow(classroom_service).to receive(:list_students).and_return([ outside_student ])

    expect {
      described_class.perform_now(config.id, user.id, course_mapping.id)
    }.not_to change(User, :count)
  end

  it "does not duplicate enrollments on re-run" do
    described_class.perform_now(config.id, user.id, course_mapping.id)
    expect {
      described_class.perform_now(config.id, user.id, course_mapping.id)
    }.not_to change(Enrollment, :count)
  end

  it "fails the sync run on service-level errors" do
    allow(classroom_service).to receive(:list_students).and_raise(GoogleApiError.new("API Error", status_code: 500))

    expect {
      described_class.perform_now(config.id, user.id, course_mapping.id)
    }.to raise_error(GoogleApiError)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("failed")
  end
end
