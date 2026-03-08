require "rails_helper"

RSpec.describe "Api::V1::Ib phase 10 operational infrastructure", type: :request do
  include ActiveJob::TestHelper

  let(:tenant) { create(:tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:headers) { { "HTTP_X_SCHOOL_ID" => school.id.to_s } }

  before do
    ActiveJob::Base.queue_adapter = :test
    mock_session(admin, tenant: tenant)
  end

  after do
    clear_enqueued_jobs
    clear_performed_jobs
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "returns tracked queue health, failures, and recovery timeline" do
    tracked_job = create(
      :ib_operational_job,
      tenant: tenant,
      school: school,
      operation_key: "import_execute",
      queue_name: "ib_imports",
      status: "dead_letter",
      last_error_message: "Import lost connection."
    )
    create(
      :ib_operational_job_event,
      ib_operational_job: tracked_job,
      tenant: tenant,
      school: school,
      actor: admin,
      event_type: "dead_lettered",
      message: "Import exhausted retries."
    )

    get "/api/v1/ib/job_operations", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("inventory").map { |row| row.fetch("key") }).to include(
      "analytics_backfill",
      "import_execute"
    )
    expect(response.parsed_body.fetch("attention_summary")).to include(
      "dead_letter" => 1
    )
    expect(response.parsed_body.fetch("failures").first).to include(
      "operation_type" => "import_execute",
      "detail" => "Import lost connection."
    )
    expect(response.parsed_body.fetch("recent_events").first).to include(
      "event_type" => "dead_lettered"
    )
  end

  it "records cancellations and enqueues analytics backfill" do
    tracked_job = create(
      :ib_operational_job,
      tenant: tenant,
      school: school,
      operation_key: "import_execute",
      queue_name: "ib_imports",
      status: "failed"
    )

    post "/api/v1/ib/job_operations/cancel",
      params: { job_id: tracked_job.id, reason: "Operator stopped retries." },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(tracked_job.reload.status).to eq("cancelled")
    expect(tracked_job.events.order(:id).last.event_type).to eq("cancelled")

    expect do
      post "/api/v1/ib/job_operations/backfill",
        params: { kind: "analytics" },
        headers: headers
    end.to have_enqueued_job(Ib::Support::AnalyticsBackfillJob)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("inventory").map { |row| row.fetch("key") }).to include(
      "analytics_backfill"
    )
  end

  it "returns the operational reliability snapshot" do
    create(
      :ib_operational_job,
      tenant: tenant,
      school: school,
      operation_key: "publishing_dispatch",
      queue_name: "ib_publishing",
      status: "failed",
      last_error_message: "Digest lock timeout."
    )

    get "/api/v1/ib/operational_reliability", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("failure_domains").map { |row| row.fetch("key") }).to include(
      "publishing_dispatch"
    )
    expect(response.parsed_body.fetch("recovery_summary")).to include("failed" => 1)
    expect(response.parsed_body.fetch("query_observability").fetch("indexed_surfaces")).not_to be_empty
    expect(response.parsed_body.fetch("load_rehearsals").map { |row| row.fetch("key") }).to include(
      "k6_reliability",
      "chaos_drill"
    )
  end
end
