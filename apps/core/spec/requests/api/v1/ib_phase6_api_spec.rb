require "rails_helper"

RSpec.describe "Api::V1::Ib phase 6 endpoints", type: :request do
  let(:tenant) do
    create(
      :tenant,
      settings: {
        "curriculum_default_profile_key" => "ib_continuum_v1",
        "curriculum_default_profile_version" => "2026.2"
      }
    )
  end
  let(:school) { create(:school, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: admin) }
  let(:headers) { { "HTTP_X_SCHOOL_ID" => school.id.to_s } }

  before do
    mock_session(admin, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "saves and validates pilot setup through governed endpoints" do
    patch "/api/v1/ib/pilot_setup",
      params: {
        pilot_setup: {
          programme: "Mixed",
          owner_assignments: {
            pilot_lead_email: "pilot@school.test",
            coordinator_email: "coordinator@school.test"
          },
          status_details: {
            academic_year_name: "2025-2026",
            guardian_visibility_confirmed: true
          }
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(%w[blocked in_progress ready_for_pilot]).to include(response.parsed_body["status"])
    expect(response.parsed_body.dig("owner_assignments", "pilot_lead_email")).to eq("pilot@school.test")

    allow_any_instance_of(Ib::Support::PilotBaselineService).to receive(:apply!).and_return(
      {
        pack_key: "ib_continuum_v1",
        pack_version: "2026.2",
        release_channel: "ib-pilot",
        release_status: "frozen",
        release_frozen: true,
        baseline_applied: true,
        baseline_settings: { "release_id" => 101 },
        flags: FeatureFlag::IB_PHASE6_REQUIRED_FLAGS.map { |key| { key: key, enabled: true } },
        healthy: true
      }
    )

    post "/api/v1/ib/pilot_setup/apply_baseline", params: { programme: "Mixed" }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("feature_flag_bundle", "pack_key")).to eq("ib_continuum_v1")

    post "/api/v1/ib/pilot_setup/validate_setup", params: { programme: "Mixed" }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["steps"]).not_to be_empty
  end

  it "stages, dry-runs, executes, and rolls back curriculum document imports" do
    post "/api/v1/ib/import_batches",
      params: {
        ib_import_batch: {
          programme: "PYP",
          source_kind: "curriculum_document",
          source_format: "csv",
          source_filename: "pyp-units.csv",
          raw_payload: "planning_context_name,title,document_type,schema_key,content_json\nGrade 5 PYP,Imported PYP Unit,ib_pyp_unit,ib.pyp.unit@v2,{\"overview\":\"Ready\"}",
          mapping_payload: {
            programme: "PYP",
            planning_context_name: planning_context.name
          }
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    batch_id = response.parsed_body.fetch("id")
    expect(response.parsed_body.fetch("rows").length).to eq(1)

    patch "/api/v1/ib/import_batches/#{batch_id}",
      params: {
        ib_import_batch: {
          mapping_payload: {
            planning_context_name: planning_context.name,
            document_type: "ib_pyp_unit",
            schema_key: "ib.pyp.unit@v2"
          }
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("mapping_payload", "document_type")).to eq("ib_pyp_unit")

    post "/api/v1/ib/import_batches/#{batch_id}/dry_run", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("ready_for_execute")
    expect(response.parsed_body.dig("dry_run_summary", "would_create")).to eq(1)

    post "/api/v1/ib/import_batches/#{batch_id}/execute", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("completed")
    expect(response.parsed_body.dig("execution_summary", "created_count")).to eq(1)

    post "/api/v1/ib/import_batches/#{batch_id}/rollback", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("rolled_back")
    expect(response.parsed_body.dig("rollback_summary", "rolled_back_refs")).not_to be_empty
  end

  it "exposes job operations failures and analytics" do
    batch = create(:ib_import_batch, tenant: tenant, school: school, academic_year: academic_year, initiated_by: admin, status: "blocked")
    create(:ib_import_row, tenant: tenant, ib_import_batch: batch, status: "blocked", error_messages: [ "title is required" ])
    story = create(:ib_learning_story, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)
    create(:ib_publishing_queue_item, tenant: tenant, school: school, ib_learning_story: story, created_by: admin, state: "ready_for_digest")

    get "/api/v1/ib/job_operations", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("inventory")).not_to be_empty
    expect(response.parsed_body.fetch("failures").map { |row| row["operation_type"] }).to include("import_batch")

    post "/api/v1/ib/job_operations/replay",
      params: { operation_type: "import_batch", id: batch.id },
      headers: headers

    expect(response).to have_http_status(:ok)

    get "/api/v1/ib/analytics", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("teacher_friction")).to include("ready_for_digest")
    expect(response.parsed_body.fetch("pilot_success_scorecard")).to include("overall_status")
  end
end
