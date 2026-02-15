require "rails_helper"

RSpec.describe OneRosterOrgSyncJob, type: :job do
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

  let(:orgs_response) do
    [
      { "sourcedId" => "org_school_1", "type" => "school", "name" => "North High", "identifier" => "America/New_York" },
      { "sourcedId" => "org_district_1", "type" => "district", "name" => "District" }
    ]
  end
  let(:sessions_response) do
    [
      {
        "sourcedId" => "year_1",
        "type" => "schoolYear",
        "title" => "2025-2026",
        "startDate" => "2025-08-01",
        "endDate" => "2026-06-30"
      },
      {
        "sourcedId" => "term_1",
        "type" => "term",
        "title" => "Fall 2025",
        "parent" => { "sourcedId" => "year_1" },
        "startDate" => "2025-08-15",
        "endDate" => "2025-12-20"
      }
    ]
  end

  before do
    allow(OneRosterClient).to receive(:new).and_return(client)
    allow(client).to receive(:get_all_orgs).and_return(orgs_response)
    allow(client).to receive(:get_all_academic_sessions).and_return(sessions_response)
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "syncs schools and academic sessions and records mappings" do
    expect {
      described_class.perform_now(integration_config.id, admin.id)
    }.to change(School.unscoped, :count).by(1)
      .and change(AcademicYear.unscoped, :count).by(1)
      .and change(Term.unscoped, :count).by(1)
      .and change(SyncMapping.unscoped, :count).by(3)

    expect(SyncMapping.unscoped.find_by(
      integration_config_id: integration_config.id,
      external_type: "oneroster_org",
      external_id: "org_school_1"
    )).to be_present

    sync_run = SyncRun.unscoped.order(:id).last
    expect(sync_run.sync_type).to eq("oneroster_org_sync")
    expect(sync_run.status).to eq("completed")
    expect(sync_run.records_processed).to eq(3)
    expect(sync_run.records_succeeded).to eq(3)
    expect(sync_run.records_failed).to eq(0)
  end

  it "updates existing mapped school records" do
    Current.tenant = tenant
    school = create(:school, tenant: tenant, name: "Old Name", timezone: "UTC")
    create(
      :sync_mapping,
      tenant: tenant,
      integration_config: integration_config,
      local_type: "School",
      local_id: school.id,
      external_type: "oneroster_org",
      external_id: "org_school_1"
    )
    Current.tenant = nil

    expect {
      described_class.perform_now(integration_config.id, admin.id)
    }.not_to change(School.unscoped, :count)

    expect(school.reload.name).to eq("North High")
    expect(school.timezone).to eq("America/New_York")
  end
end
