require "rails_helper"

RSpec.describe ClassroomCourseworkPushJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant, google_refresh_token: "test-refresh-token")
    u.add_role(:admin)
    u
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:assignment) do
    create(:assignment, tenant: tenant, course: course, created_by: user,
      title: "Essay 1", description: "Write an essay", points_possible: 100, status: "published")
  end
  let(:config) do
    create(:integration_config, tenant: tenant, created_by: user, status: "active")
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

  let(:coursework_result) { double("Coursework", id: "cw_123") }
  let(:classroom_service) { instance_double(GoogleClassroomService) }

  before do
    course_mapping # ensure created
    allow(GoogleClassroomService).to receive(:new).and_return(classroom_service)
  end

  it "creates coursework and a sync mapping" do
    allow(classroom_service).to receive(:create_coursework).and_return(coursework_result)

    expect {
      described_class.perform_now(config.id, user.id, assignment.id)
    }.to change(SyncMapping, :count).by(1)

    mapping = SyncMapping.find_local(config, "Assignment", assignment.id)
    expect(mapping).to be_present
    expect(mapping.external_id).to eq("cw_123")
    expect(mapping.external_type).to eq("classroom_coursework")
  end

  it "updates existing coursework when mapping exists" do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: config,
      local_type: "Assignment",
      local_id: assignment.id,
      external_id: "cw_existing",
      external_type: "classroom_coursework"
    )
    allow(classroom_service).to receive(:update_coursework).and_return(true)

    expect {
      described_class.perform_now(config.id, user.id, assignment.id)
    }.not_to change(SyncMapping, :count)

    expect(classroom_service).to have_received(:update_coursework).with(
      "gc_course_1", "cw_existing", hash_including(title: "Essay 1")
    )
  end

  it "creates a completed sync run" do
    allow(classroom_service).to receive(:create_coursework).and_return(coursework_result)

    described_class.perform_now(config.id, user.id, assignment.id)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.sync_type).to eq("coursework_push")
    expect(sync_run.direction).to eq("push")
    expect(sync_run.records_succeeded).to eq(1)
  end

  it "fails when no course mapping exists" do
    course_mapping.destroy!

    expect {
      described_class.perform_now(config.id, user.id, assignment.id)
    }.to raise_error(RuntimeError, /No course mapping found/)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("failed")
  end
end
