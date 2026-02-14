require "rails_helper"

RSpec.describe ClassroomGradePassbackJob, type: :job do
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
  let(:assignment) do
    create(:assignment, tenant: tenant, course: course, created_by: user,
      status: "published", points_possible: 100)
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
  let(:coursework_mapping) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: config,
      local_type: "Assignment",
      local_id: assignment.id,
      external_id: "cw_123",
      external_type: "classroom_coursework"
    )
  end

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:classroom_service) { instance_double(GoogleClassroomService) }
  let(:student_user) do
    s = create(:user, tenant: tenant)
    s.add_role(:student)
    s
  end
  let(:enrollment) { create(:enrollment, tenant: tenant, user: student_user, section: section, role: "student") }
  let(:student_mapping) do
    create(:sync_mapping,
      tenant: tenant,
      integration_config: config,
      local_type: "Enrollment",
      local_id: enrollment.id,
      external_id: "classroom_student_1",
      external_type: "classroom_student"
    )
  end

  before do
    course_mapping
    coursework_mapping
    student_mapping
    allow(GoogleClassroomService).to receive(:new).and_return(classroom_service)
  end

  it "pushes grades for graded submissions" do
    submission = create(:submission, tenant: tenant, assignment: assignment, user: student_user,
      status: "graded", grade: 85)

    classroom_sub = double("StudentSubmission", id: "sub_1", user_id: "classroom_student_1")
    allow(classroom_service).to receive(:list_student_submissions).and_return([ classroom_sub ])
    allow(classroom_service).to receive(:update_student_submission_grade)

    described_class.perform_now(config.id, user.id, assignment.id)

    expect(classroom_service).to have_received(:update_student_submission_grade).with(
      "gc_course_1", "cw_123", "sub_1", 85
    )

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.records_succeeded).to eq(1)
  end

  it "skips submissions without student mappings" do
    other_student = create(:user, tenant: tenant)
    create(:submission, tenant: tenant, assignment: assignment, user: other_student,
      status: "graded", grade: 90)

    allow(classroom_service).to receive(:list_student_submissions).and_return([])

    described_class.perform_now(config.id, user.id, assignment.id)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("completed")
    expect(sync_run.records_succeeded).to eq(0)
  end

  it "fails when no coursework mapping exists" do
    coursework_mapping.destroy!

    expect {
      described_class.perform_now(config.id, user.id, assignment.id)
    }.to raise_error(RuntimeError, /No coursework mapping found/)

    sync_run = SyncRun.last
    expect(sync_run.status).to eq("failed")
  end
end
