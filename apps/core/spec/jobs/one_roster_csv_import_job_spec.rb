require "rails_helper"

RSpec.describe OneRosterCsvImportJob, type: :job do
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

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:fixture_path) { Rails.root.join("spec/fixtures/oneroster_sample.zip") }
  let(:blob) do
    ActiveStorage::Blob.create_and_upload!(
      io: File.open(fixture_path),
      filename: "oneroster_sample.zip",
      content_type: "application/zip"
    )
  end

  describe "#perform" do
    it "imports orgs, academic sessions, users, classes, and enrollments from CSV" do
      described_class.new.perform(config.id, blob.id, admin.id)

      # Should have created 1 school (org-2 has status tobedeleted)
      expect(School.count).to eq(1)
      expect(School.first.name).to eq("Lincoln Elementary")

      # Should have created 1 academic year and 1 term
      expect(AcademicYear.count).to eq(1)
      expect(AcademicYear.first.name).to eq("2026-2027")
      expect(Term.count).to eq(1)
      expect(Term.first.name).to eq("Fall 2026")

      # Should have created 2 users (u-3 no email, u-4 tobedeleted)
      new_users = User.where.not(id: admin.id)
      expect(new_users.count).to eq(2)

      # Should have created 1 course
      expect(Course.count).to eq(1)
      expect(Course.first.name).to eq("Math 101")

      # Should have created 2 enrollments
      expect(Enrollment.count).to eq(2)

      # SyncRun should be completed
      sync_run = SyncRun.last
      expect(sync_run.sync_type).to eq("oneroster_csv_import")
      expect(sync_run.status).to eq("completed")
      expect(sync_run.records_succeeded).to be > 0
    end

    it "skips rows with status tobedeleted" do
      described_class.new.perform(config.id, blob.id, admin.id)

      # org-2 should be skipped
      expect(School.find_by(name: "Deleted School")).to be_nil
      # u-4 should be skipped
      expect(User.find_by(email: "deleted@school.edu")).to be_nil
    end

    it "logs warning for users without email" do
      described_class.new.perform(config.id, blob.id, admin.id)

      sync_run = SyncRun.last
      warnings = sync_run.sync_logs.where(level: "warn")
      email_warnings = warnings.select { |w| w.message.include?("without email") }
      expect(email_warnings).not_to be_empty
    end

    it "creates SyncMappings for all entities" do
      described_class.new.perform(config.id, blob.id, admin.id)

      expect(SyncMapping.where(external_type: "oneroster_org").count).to eq(1)
      expect(SyncMapping.where(external_type: "oneroster_academic_session").count).to eq(2)
      expect(SyncMapping.where(external_type: "oneroster_user").count).to eq(2)
      expect(SyncMapping.where(external_type: "oneroster_class").count).to eq(1)
      expect(SyncMapping.where(external_type: "oneroster_enrollment").count).to eq(2)
    end

    it "is idempotent - running twice does not duplicate records" do
      described_class.new.perform(config.id, blob.id, admin.id)
      initial_school_count = School.count
      initial_user_count = User.count

      # Create a new blob for the second run
      blob2 = ActiveStorage::Blob.create_and_upload!(
        io: File.open(fixture_path),
        filename: "oneroster_sample2.zip",
        content_type: "application/zip"
      )
      described_class.new.perform(config.id, blob2.id, admin.id)

      expect(School.count).to eq(initial_school_count)
      expect(User.count).to eq(initial_user_count)
    end
  end
end
