require "rails_helper"

RSpec.describe OneRosterEnrollmentSyncJob, type: :job do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    u
  end
  let(:config) do
    create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
  end
  let(:mock_client) { instance_double(OneRosterClient) }
  let!(:academic_year) do
    create(:academic_year, tenant: tenant)
  end
  let!(:term) do
    create(:term, tenant: tenant, academic_year: academic_year)
  end

  before do
    Current.tenant = tenant
    allow(OneRosterClient).to receive(:new).and_return(mock_client)
  end

  after { Current.tenant = nil }

  describe "#perform" do
    it "creates enrollments linking users to courses" do
      student = create(:user, tenant: tenant, email: "student@school.edu")
      course = create(:course, tenant: tenant, academic_year: academic_year)

      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "User", local_id: student.id,
        external_id: "u-1", external_type: "oneroster_user"
      )
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "Course", local_id: course.id,
        external_id: "c-1", external_type: "oneroster_class"
      )

      allow(mock_client).to receive(:get_all_enrollments).and_return([
        {
          "sourcedId" => "e-1",
          "user" => { "sourcedId" => "u-1" },
          "class" => { "sourcedId" => "c-1" },
          "role" => "student"
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(Enrollment, :count).by(1)

      enrollment = Enrollment.last
      expect(enrollment.user).to eq(student)
      expect(enrollment.role).to eq("student")
    end

    it "warns when user mapping is not found" do
      course = create(:course, tenant: tenant, academic_year: academic_year)
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "Course", local_id: course.id,
        external_id: "c-1", external_type: "oneroster_class"
      )

      allow(mock_client).to receive(:get_all_enrollments).and_return([
        {
          "sourcedId" => "e-1",
          "user" => { "sourcedId" => "unknown-user" },
          "class" => { "sourcedId" => "c-1" },
          "role" => "student"
        }
      ])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_logs.where(level: "warn").count).to eq(1)
    end

    it "warns when class mapping is not found" do
      student = create(:user, tenant: tenant, email: "student2@school.edu")
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "User", local_id: student.id,
        external_id: "u-1", external_type: "oneroster_user"
      )

      allow(mock_client).to receive(:get_all_enrollments).and_return([
        {
          "sourcedId" => "e-1",
          "user" => { "sourcedId" => "u-1" },
          "class" => { "sourcedId" => "unknown-class" },
          "role" => "student"
        }
      ])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_logs.where(level: "warn").count).to eq(1)
    end

    it "is idempotent - updates existing enrollment" do
      student = create(:user, tenant: tenant, email: "student3@school.edu")
      course = create(:course, tenant: tenant, academic_year: academic_year)
      section = create(:section, tenant: tenant, course: course, term: term)
      enrollment = create(:enrollment, tenant: tenant, user: student, section: section, role: "student")

      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "User", local_id: student.id,
        external_id: "u-1", external_type: "oneroster_user"
      )
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "Course", local_id: course.id,
        external_id: "c-1", external_type: "oneroster_class"
      )
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "Enrollment", local_id: enrollment.id,
        external_id: "e-1", external_type: "oneroster_enrollment"
      )

      allow(mock_client).to receive(:get_all_enrollments).and_return([
        {
          "sourcedId" => "e-1",
          "user" => { "sourcedId" => "u-1" },
          "class" => { "sourcedId" => "c-1" },
          "role" => "teacher"
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.not_to change(Enrollment, :count)

      expect(enrollment.reload.role).to eq("teacher")
    end

    it "creates a completed SyncRun" do
      allow(mock_client).to receive(:get_all_enrollments).and_return([])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_type).to eq("oneroster_enrollment_sync")
      expect(sync_run.status).to eq("completed")
    end
  end
end
