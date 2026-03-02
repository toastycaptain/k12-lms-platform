require "rails_helper"

RSpec.describe OneRosterAutoSyncJob, type: :job do
  include ActiveJob::TestHelper

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
        "client_secret" => "client-secret",
        "auto_sync_enabled" => true,
        "sync_interval_hours" => 24
      }
    )
  end

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    clear_performed_jobs
  end

  after do
    clear_enqueued_jobs
    clear_performed_jobs
    Current.tenant = nil
    Current.user = nil
  end

  it "enqueues org and user sync jobs when due and auto sync is enabled" do
    integration_config

    expect {
      described_class.perform_now
    }.to have_enqueued_job(OneRosterOrgSyncJob).with(integration_config.id)
      .and have_enqueued_job(OneRosterUserSyncJob).with(integration_config.id)
      .and change(AuditLog.unscoped, :count).by(1)

    expect(AuditLog.unscoped.order(:id).last.event_type).to eq("integration.oneroster_auto_sync_triggered")
  end

  it "does not enqueue when auto sync is disabled" do
    integration_config.update!(settings: integration_config.settings.merge("auto_sync_enabled" => false))

    expect {
      described_class.perform_now
    }.not_to have_enqueued_job(OneRosterOrgSyncJob)
  end

  it "does not enqueue when a sync run is already in progress" do
    create(
      :sync_run,
      tenant: tenant,
      integration_config: integration_config,
      sync_type: "oneroster_user_sync",
      direction: "pull",
      status: "running"
    )

    expect {
      described_class.perform_now
    }.not_to have_enqueued_job(OneRosterOrgSyncJob)
  end

  it "does not enqueue when a recent sync run is within interval" do
    create(
      :sync_run,
      tenant: tenant,
      integration_config: integration_config,
      sync_type: "oneroster_user_sync",
      direction: "pull",
      status: "completed",
      created_at: 2.hours.ago
    )

    expect {
      described_class.perform_now
    }.not_to have_enqueued_job(OneRosterOrgSyncJob)
  end
end
