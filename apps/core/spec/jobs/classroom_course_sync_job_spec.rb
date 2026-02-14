require "rails_helper"

RSpec.describe ClassroomCourseSyncJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant, google_refresh_token: "test-refresh-token")
    u.add_role(:admin)
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:config) do
    create(:integration_config, tenant: tenant, created_by: user, status: "active")
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:classroom_course1) do
    double("Course", id: "gc_course_1", name: "Math 101")
  end
  let(:classroom_course2) do
    double("Course", id: "gc_course_2", name: "Science 201")
  end
  let(:classroom_service) { instance_double(GoogleClassroomService) }

  before do
    academic_year # ensure created
    allow(GoogleClassroomService).to receive(:new).and_return(classroom_service)
    allow(classroom_service).to receive(:list_courses).and_return([ classroom_course1, classroom_course2 ])
  end

  it "creates courses and sync mappings for each classroom course" do
    expect {
      described_class.perform_now(config.id, user.id)
    }.to change(Course, :count).by(2)
     .and change(SyncMapping, :count).by(2)

    mapping1 = SyncMapping.find_external(config, "classroom_course", "gc_course_1")
    expect(mapping1).to be_present
    expect(mapping1.local_type).to eq("Course")

    course = Course.find(mapping1.local_id)
    expect(course.name).to eq("Math 101")
  end

  it "creates a completed sync run" do
    described_class.perform_now(config.id, user.id)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.sync_type).to eq("course_sync")
    expect(sync_run.direction).to eq("pull")
    expect(sync_run.records_processed).to eq(2)
    expect(sync_run.records_succeeded).to eq(2)
  end

  it "updates existing courses when name changes" do
    course = create(:course, tenant: tenant, name: "Old Math", academic_year: academic_year)
    create(:sync_mapping,
      tenant: tenant,
      integration_config: config,
      local_type: "Course",
      local_id: course.id,
      external_id: "gc_course_1",
      external_type: "classroom_course"
    )

    allow(classroom_service).to receive(:list_courses).and_return([ classroom_course1 ])

    expect {
      described_class.perform_now(config.id, user.id)
    }.not_to change(Course, :count)

    course.reload
    expect(course.name).to eq("Math 101")
  end

  it "handles errors for individual courses without failing the run" do
    allow(classroom_service).to receive(:list_courses).and_return([ classroom_course1 ])
    allow(AcademicYear).to receive(:first).and_return(nil)

    expect {
      described_class.perform_now(config.id, user.id)
    }.not_to raise_error

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.records_failed).to eq(1)
  end

  it "fails the sync run on service-level errors" do
    allow(classroom_service).to receive(:list_courses).and_raise(GoogleApiError.new("API Error", status_code: 500))

    expect {
      described_class.perform_now(config.id, user.id)
    }.to raise_error(GoogleApiError)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("failed")
  end
end
