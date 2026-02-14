require "rails_helper"

RSpec.describe OneRosterOrgSyncJob, type: :job do
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

  before do
    Current.tenant = tenant
    allow(OneRosterClient).to receive(:new).and_return(mock_client)
  end

  after { Current.tenant = nil }

  describe "#perform" do
    it "syncs orgs of type school into School records" do
      allow(mock_client).to receive(:get_all_orgs).and_return([
        { "sourcedId" => "org-1", "name" => "Lincoln Elementary", "type" => "school" },
        { "sourcedId" => "org-2", "name" => "District Office", "type" => "district" }
      ])
      allow(mock_client).to receive(:get_all_academic_sessions).and_return([])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(School, :count).by(1)

      school = School.find_by(name: "Lincoln Elementary")
      expect(school).to be_present
      mapping = SyncMapping.find_external(config, "oneroster_org", "org-1")
      expect(mapping.local_id).to eq(school.id)
    end

    it "updates existing school when SyncMapping exists" do
      school = School.create!(name: "Old Name", tenant: tenant, timezone: "America/New_York")
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "School", local_id: school.id,
        external_id: "org-1", external_type: "oneroster_org"
      )

      allow(mock_client).to receive(:get_all_orgs).and_return([
        { "sourcedId" => "org-1", "name" => "New Name", "type" => "school" }
      ])
      allow(mock_client).to receive(:get_all_academic_sessions).and_return([])

      described_class.new.perform(config.id, admin.id)

      expect(school.reload.name).to eq("New Name")
    end

    it "syncs schoolYear sessions into AcademicYear records" do
      allow(mock_client).to receive(:get_all_orgs).and_return([])
      allow(mock_client).to receive(:get_all_academic_sessions).and_return([
        {
          "sourcedId" => "ay-1", "title" => "2026-2027",
          "type" => "schoolYear",
          "startDate" => "2026-08-01", "endDate" => "2027-06-30"
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(AcademicYear, :count).by(1)

      ay = AcademicYear.find_by(name: "2026-2027")
      expect(ay.start_date).to eq(Date.new(2026, 8, 1))
    end

    it "syncs term sessions into Term records" do
      academic_year = AcademicYear.create!(
        name: "2026-2027", tenant: tenant,
        start_date: Date.new(2026, 8, 1), end_date: Date.new(2027, 6, 30)
      )
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "AcademicYear", local_id: academic_year.id,
        external_id: "ay-1", external_type: "oneroster_academic_session"
      )

      allow(mock_client).to receive(:get_all_orgs).and_return([])
      allow(mock_client).to receive(:get_all_academic_sessions).and_return([
        {
          "sourcedId" => "term-1", "title" => "Fall 2026",
          "type" => "term",
          "startDate" => "2026-08-01", "endDate" => "2026-12-20",
          "parent" => { "sourcedId" => "ay-1" }
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(Term, :count).by(1)

      term = Term.find_by(name: "Fall 2026")
      expect(term.academic_year).to eq(academic_year)
    end

    it "creates a SyncRun with correct lifecycle" do
      allow(mock_client).to receive(:get_all_orgs).and_return([])
      allow(mock_client).to receive(:get_all_academic_sessions).and_return([])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_type).to eq("oneroster_org_sync")
      expect(sync_run.direction).to eq("pull")
      expect(sync_run.status).to eq("completed")
      expect(sync_run.triggered_by).to eq(admin)
    end

    it "marks SyncRun as failed on error" do
      allow(mock_client).to receive(:get_all_orgs).and_raise(OneRosterError.new("Connection failed"))

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to raise_error(OneRosterError)

      sync_run = SyncRun.last
      expect(sync_run.status).to eq("failed")
      expect(sync_run.error_message).to eq("Connection failed")
    end
  end
end
