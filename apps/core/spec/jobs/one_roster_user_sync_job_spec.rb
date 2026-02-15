require "rails_helper"

RSpec.describe OneRosterUserSyncJob, type: :job do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:integration_config) do
    create(
      :integration_config,
      tenant: tenant,
      created_by: admin,
      provider: "oneroster",
      status: "active",
      settings: {
        "base_url" => "https://oneroster.example.com",
        "client_id" => "client-id",
        "client_secret" => "client-secret"
      }
    )
  end
  let(:client) { instance_double(OneRosterClient) }

  let(:users_response) do
    [
      {
        "sourcedId" => "user_teacher_1",
        "email" => "teacher1@example.edu",
        "givenName" => "Tess",
        "familyName" => "Teacher",
        "role" => "teacher"
      },
      {
        "sourcedId" => "user_student_1",
        "email" => "student1@example.edu",
        "givenName" => "Sam",
        "familyName" => "Student",
        "role" => "student"
      }
    ]
  end
  let(:classes_response) do
    [
      {
        "sourcedId" => "class_1",
        "title" => "Algebra 1 - A",
        "classCode" => "ALG1-A",
        "term" => { "sourcedId" => "term_1" }
      }
    ]
  end
  let(:enrollments_response) do
    [
      {
        "sourcedId" => "enroll_teacher_1",
        "role" => "teacher",
        "user" => { "sourcedId" => "user_teacher_1" },
        "class" => { "sourcedId" => "class_1" }
      },
      {
        "sourcedId" => "enroll_student_1",
        "role" => "student",
        "user" => { "sourcedId" => "user_student_1" },
        "class" => { "sourcedId" => "class_1" }
      }
    ]
  end

  before do
    Current.tenant = tenant
    academic_year = create(:academic_year, tenant: tenant, name: "2025-2026")
    term = create(:term, tenant: tenant, academic_year: academic_year, name: "Fall 2025")
    create(
      :sync_mapping,
      tenant: tenant,
      integration_config: integration_config,
      local_type: "Term",
      local_id: term.id,
      external_type: "oneroster_academic_session",
      external_id: "term_1"
    )
    Current.tenant = nil

    allow(OneRosterClient).to receive(:new).and_return(client)
    allow(client).to receive(:get_all_users).and_return(users_response)
    allow(client).to receive(:get_all_classes).and_return(classes_response)
    allow(client).to receive(:get_all_enrollments).and_return(enrollments_response)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "syncs users, classes, enrollments, and mappings" do
    expect {
      described_class.perform_now(integration_config.id, admin.id)
    }.to change(User.unscoped.where(tenant_id: tenant.id), :count).by(2)
      .and change(Course.unscoped, :count).by(1)
      .and change(Section.unscoped, :count).by(1)
      .and change(Enrollment.unscoped, :count).by(2)

    teacher = User.unscoped.find_by(email: "teacher1@example.edu", tenant_id: tenant.id)
    student = User.unscoped.find_by(email: "student1@example.edu", tenant_id: tenant.id)
    expect(teacher).to be_present
    expect(student).to be_present
    expect(teacher.has_role?(:teacher)).to be true
    expect(student.has_role?(:student)).to be true

    expect(SyncMapping.unscoped.find_by(
      integration_config_id: integration_config.id,
      external_type: "oneroster_class",
      external_id: "class_1"
    )).to be_present

    sync_run = SyncRun.unscoped.order(:id).last
    expect(sync_run.sync_type).to eq("oneroster_user_sync")
    expect(sync_run.status).to eq("completed")
    expect(sync_run.records_processed).to eq(5)
    expect(sync_run.records_succeeded).to eq(5)
    expect(sync_run.records_failed).to eq(0)
  end
end
