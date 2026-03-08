require "rails_helper"

RSpec.describe "IB Phase 10 Step 6 migration moat", type: :request do
  let(:tenant) { create(:tenant, slug: "phase10-migration") }
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:admin) { create(:user, tenant: tenant, email: "admin-migration@example.com") }
  let(:planning_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: admin,
      name: "Grade 5 PYP"
    )
  end
  let(:headers) do
    {
      "X-Tenant-Slug" => tenant.slug,
      "X-School-Id" => school.id.to_s
    }
  end

  before do
    admin.add_role(:admin)
    admin.add_role(:teacher)
  end

  def sign_in(user)
    post "/api/v1/testing/session",
      params: { email: user.email, tenant_slug: tenant.slug, role: "admin" },
      headers: { "ACCEPT" => "application/json" }
    expect(response).to have_http_status(:ok)
  end

  it "stages a source-aware batch with manifest, dry-run safeguards, and resumable metadata" do
    sign_in(admin)

    post "/api/v1/ib/import_batches",
      params: {
        ib_import_batch: {
          programme: "PYP",
          source_kind: "curriculum_document",
          source_format: "csv",
          source_filename: "managebac-pyp.csv",
          source_system: "managebac",
          import_mode: "draft",
          coexistence_mode: true,
          academic_year_id: academic_year.id,
          raw_payload: "planning_context_name,title,document_type,schema_key,content_json\n#{planning_context.name},Imported Unit,ib_pyp_unit,ib.pyp.unit@v2,{\"overview\":\"Ready\"}"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    batch_id = response.parsed_body.fetch("id")
    expect(response.parsed_body).to include(
      "source_system" => "managebac",
      "import_mode" => "draft",
      "coexistence_mode" => true,
      "source_contract_version" => "managebac.v2"
    )
    expect(response.parsed_body.dig("preview_summary", "source_artifact_manifest", "row_count")).to eq(1)
    expect(response.parsed_body.dig("rollback_capabilities", "shadow_mode_supported")).to eq(true)

    post "/api/v1/ib/import_batches/#{batch_id}/dry_run", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("preview_summary", "entity_graph")).to include("curriculum_document")
    expect(response.parsed_body.dig("preview_summary", "shadow_mode_plan", "enabled")).to eq(true)
    expect(response.parsed_body.dig("preview_summary", "delta_rerun_support", "enabled")).to eq(true)
    expect(response.parsed_body.dig("rows", 0, "resolution_payload", "strategy")).to eq("create_new_document")
  end

  it "returns migration sessions with adapter protocols, shared manifest, and confidence signals" do
    sign_in(admin)

    batch = create(
      :ib_import_batch,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      initiated_by: admin,
      source_system: "toddle",
      source_kind: "curriculum_document",
      source_format: "csv",
      import_mode: "draft",
      coexistence_mode: true,
      source_contract_version: "toddle.v2",
      preview_summary: {
        "source_artifact_manifest" => {
          "row_count" => 3,
          "artifacts" => { "csv" => { "row_count" => 3 } }
        }
      }
    )
    create(
      :ib_migration_session,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      initiated_by: admin,
      ib_import_batch: batch,
      source_system: "toddle",
      status: "shadow_mode",
      cutover_state: "shadow_mode",
      dry_run_summary: { "would_create" => 3 },
      reconciliation_summary: { "open_items" => 1 }
    )
    create(
      :ib_migration_mapping_template,
      tenant: tenant,
      school: school,
      created_by: admin,
      source_system: "managebac",
      name: "ManageBac mapping",
      shared: true
    )

    get "/api/v1/ib/migration_sessions", headers: headers

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["adapter_protocols"].dig("toddle", "connector")).to eq("toddle_export_adapter")
    expect(body["shared_import_manifest"]).to include("version" => "phase10.v1")
    expect(body["template_generators"]).to include("toddle_poi_template_generator")
    expect(body["confidence_summary"]).to include("total_sessions" => 1)
    expect(body.dig("sessions", 0, "shadow_mode", "enabled")).to eq(true)
    expect(body.dig("sessions", 0, "delta_rerun", "enabled")).to eq(true)
    expect(body.dig("sessions", 0, "source_manifest", "row_count")).to eq(3)
    expect(body.dig("mapping_templates", 0, "manual_override_panels")).to include("field_mapping")
  end
end
