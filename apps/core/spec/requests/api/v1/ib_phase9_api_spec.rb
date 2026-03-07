require "rails_helper"

RSpec.describe "Api::V1::Ib phase 9 endpoints", type: :request do
  let(:tenant) do
    create(
      :tenant,
      settings: {
        "curriculum_default_profile_key" => "ib_continuum_v1",
        "curriculum_default_profile_version" => "2026.2"
      }
    )
  end
  let!(:documents_flag) { FeatureFlag.create!(key: "curriculum_documents_v1", enabled: true, tenant: tenant) }
  let!(:school_scoping_flag) { FeatureFlag.create!(key: "school_scoping_v1", enabled: true, tenant: tenant) }
  let!(:pack_flag) { FeatureFlag.create!(key: "ib_pack_v2", enabled: true, tenant: tenant) }
  let!(:workflow_flag) { FeatureFlag.create!(key: "ib_pack_v2_workflows", enabled: true, tenant: tenant) }
  let!(:reporting_flag) { FeatureFlag.create!(key: "ib_reporting_v1", enabled: true, tenant: tenant) }
  let!(:search_flag) { FeatureFlag.create!(key: "ib_universal_search_v1", enabled: true, tenant: tenant) }
  let!(:saved_search_flag) { FeatureFlag.create!(key: "ib_saved_searches_v1", enabled: true, tenant: tenant) }
  let!(:family_flag) { FeatureFlag.create!(key: "ib_family_publishing_v1", enabled: true, tenant: tenant) }
  let!(:guardian_flag) { FeatureFlag.create!(key: "ib_guardian_calm_mode_v1", enabled: true, tenant: tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:headers) { { "HTTP_X_SCHOOL_ID" => school.id.to_s } }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Alex", last_name: "Admin")
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Taylor", last_name: "Teacher")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Sam", last_name: "Student")
    user.add_role(:student)
    Current.tenant = nil
    user
  end
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
  let!(:document) do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      title: "How we organize ourselves",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )
  end
  let!(:report) do
    create(
      :ib_report,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      student: student,
      author: admin,
      audience: "guardian",
      programme: "PYP"
    )
  end
  let!(:delivery_receipt) do
    create(
      :ib_delivery_receipt,
      tenant: tenant,
      school: school,
      user: teacher,
      deliverable_id: report.id,
      state: "acknowledged"
    )
  end

  before do
    mock_session(admin, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "creates pilot cohorts, captures baselines, and lists support feedback" do
    post "/api/v1/ib/pilot_profiles",
      params: {
        cohort_key: "phase9-pilot",
        name: "Phase 9 Pilot",
        archetype_key: "continuum",
        programme_scope: "Mixed"
      },
      headers: headers

    expect(response).to have_http_status(:created)
    profile_id = response.parsed_body.fetch("id")

    post "/api/v1/ib/pilot_baseline_snapshots",
      params: { ib_pilot_profile_id: profile_id },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("metric_payload")).to include("teacher", "guardian")

    post "/api/v1/ib/pilot_feedback_items",
      params: {
        title: "Launch signal",
        detail: "Coordinator reviewed the pilot dashboard.",
        category: "onboarding",
        role_scope: "coordinator",
        surface: "rollout_console"
      },
      headers: headers

    expect(response).to have_http_status(:created)

    get "/api/v1/ib/pilot_support", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("launch_day")).not_to be_empty
    expect(response.parsed_body.fetch("feedback_queue").map { |row| row["title"] }).to include("Launch signal")
  end

  it "creates migration sessions and mapping templates for source-aware cutover work" do
    post "/api/v1/ib/migration_sessions",
      params: {
        session_key: "phase9-migration",
        source_system: "toddle",
        status: "discovered",
        cutover_state: "discovered"
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("source_contract")).to include("assumptions")

    post "/api/v1/ib/migration_mapping_templates",
      params: {
        source_system: "managebac",
        programme: "Mixed",
        name: "Phase 9 Template",
        shared: true
      },
      headers: headers

    expect(response).to have_http_status(:created)

    get "/api/v1/ib/migration_sessions", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("sessions").map { |row| row["session_key"] }).to include("phase9-migration")
    expect(response.parsed_body.fetch("mapping_templates").map { |row| row["name"] }).to include("Phase 9 Template")
  end

  it "creates reporting cycles and templates for the command center" do
    post "/api/v1/ib/report_cycles",
      params: {
        cycle_key: "phase9-cycle",
        programme: "Mixed",
        status: "open"
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("cycle_key")).to eq("phase9-cycle")

    post "/api/v1/ib/report_templates",
      params: {
        programme: "Mixed",
        audience: "guardian",
        family: "conference_packet",
        name: "Phase 9 Reporting Template"
      },
      headers: headers

    expect(response).to have_http_status(:created)

    get "/api/v1/ib/report_cycles", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("cycles").map { |row| row["cycle_key"] }).to include("phase9-cycle")
    expect(response.parsed_body.fetch("templates").map { |row| row["name"] }).to include("Phase 9 Reporting Template")
    expect(response.parsed_body.fetch("delivery_summary")).to include("reports", "acknowledged")
  end

  it "records collaboration events and tasks in the phase 9 workbench" do
    post "/api/v1/ib/collaboration_tasks",
      params: {
        curriculum_document_id: document.id,
        title: "Phase 9 follow-up",
        detail: "Check the collaboration rollout guidance.",
        priority: "high",
        status: "open"
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("priority")).to eq("high")

    post "/api/v1/ib/collaboration_events",
      params: {
        curriculum_document_id: document.id,
        event_name: "replay_event",
        route_id: "ib.review",
        scope_key: document.id.to_s,
        durable: true
      },
      headers: headers

    expect(response).to have_http_status(:created)

    get "/api/v1/ib/collaboration_workbench",
      params: { curriculum_document_id: document.id },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("recent_events").map { |row| row["event_name"] }).to include("replay_event")
    expect(response.parsed_body.fetch("tasks").map { |row| row["title"] }).to include("Phase 9 follow-up")
  end

  it "captures benchmark, intelligence, trust, mobile, search, and replacement-readiness signals" do
    create(:ib_trust_policy, tenant: tenant, school: school, created_by: admin)
    create(:ib_search_profile, tenant: tenant, school: school, created_by: admin)
    create(:ib_intelligence_metric_definition, tenant: tenant, school: school, created_by: admin)
    create(:ib_mobile_sync_diagnostic, tenant: tenant, school: school, user: admin, status: "healthy")
    profile = create(:ib_pilot_profile, tenant: tenant, school: school, academic_year: academic_year, created_by: admin)

    post "/api/v1/ib/benchmark_snapshots",
      params: {
        ib_pilot_profile_id: profile.id,
        role_scope: "teacher",
        workflow_family: "planning"
      },
      headers: headers

    expect(response).to have_http_status(:created)

    get "/api/v1/ib/intelligence_metric_definitions", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("metric_dictionary")).not_to be_empty

    get "/api/v1/ib/trust_policies", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("policies")).not_to be_empty

    get "/api/v1/ib/mobile_sync_diagnostics", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("trust_contract")).not_to be_empty

    get "/api/v1/ib/search_profiles", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("profiles")).not_to be_empty

    post "/api/v1/ib/replacement_readiness", headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body.fetch("status")).to be_in(%w[green yellow red])

    get "/api/v1/ib/replacement_readiness", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("tracks").map { |row| row["key"] }).to include("adoption", "migration", "search")
    expect(response.parsed_body.fetch("pilot_goal_checks")).not_to be_empty
  end
end
