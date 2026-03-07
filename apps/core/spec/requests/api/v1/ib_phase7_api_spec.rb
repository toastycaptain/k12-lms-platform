require "rails_helper"

RSpec.describe "Api::V1::Ib phase 7 endpoints", type: :request do
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
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Colin", last_name: "Admin")
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:headers) { { "HTTP_X_SCHOOL_ID" => school.id.to_s } }
  let(:planning_context) do
    create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: admin)
  end
  let!(:pyp_document) do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      title: "How the world works",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )
  end
  let!(:pyp_document_version) do
    version = create(
      :curriculum_document_version,
      curriculum_document: pyp_document,
      tenant: tenant,
      created_by: admin,
      title: pyp_document.title,
      content: {
        "central_idea" => "Systems shape communities.",
        "family_support_prompt" => "Ask what system changed this week.",
        "learning_goal" => "Explain how systems influence choices.",
        "learning_experiences" => [
          { "title" => "Provocation", "detail" => "Notice visible systems." }
        ]
      }
    )
    pyp_document.update!(current_version_id: version.id)
    version
  end
  let!(:myp_document) do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_myp_unit",
      title: "MYP Systems Inquiry",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.myp.unit@v2"
    )
    version = create(
      :curriculum_document_version,
      curriculum_document: document,
      tenant: tenant,
      created_by: admin,
      title: document.title,
      content: {
        "key_concepts" => [ "systems" ],
        "global_contexts" => [ "scientific and technical innovation" ],
        "atl_focus" => [ "research" ],
        "assessment_criteria" => [ "criterion_a" ]
      }
    )
    document.update!(current_version_id: version.id)
    document
  end
  let!(:due_today_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      programme: "DP",
      record_family: "dp_ee",
      status: "open",
      risk_level: "risk",
      title: "Extended essay draft",
      due_on: Date.current
    )
  end
  let!(:specialist_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      programme: "PYP",
      record_family: "specialist",
      status: "awaiting_response",
      title: "Specialist support handoff",
      next_action: "Respond before the next class block."
    )
  end
  let!(:evidence_item) do
    create(
      :ib_evidence_item,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      curriculum_document: pyp_document,
      student: admin,
      created_by: admin,
      title: "Prototype reflection",
      summary: "A notable learning moment.",
      programme: "PYP",
      status: "reflection_requested",
      visibility: "guardian_visible"
    )
  end
  let!(:reflection_request) do
    create(
      :ib_reflection_request,
      tenant: tenant,
      ib_evidence_item: evidence_item,
      requested_by: admin,
      student: admin
    )
  end
  let!(:learning_story) do
    create(
      :ib_learning_story,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      state: "published",
      title: "Stories this week",
      programme: "PYP"
    )
  end
  let!(:translation) do
    create(
      :ib_learning_story_translation,
      tenant: tenant,
      ib_learning_story: learning_story,
      translated_by: admin,
      state: "reviewed",
      locale: "es"
    )
  end
  let!(:goal) { create(:goal, tenant: tenant, student: admin, title: "Strengthen reflection quality") }
  let!(:collaborator_owned) do
    create(
      :ib_document_collaborator,
      curriculum_document: pyp_document,
      tenant: tenant,
      user: admin,
      assigned_by: admin,
      role: "specialist_contributor",
      contribution_mode: "comment",
      metadata: { "detail" => "Support the current inquiry block." }
    )
  end
  let!(:collaborator_requested) do
    create(
      :ib_document_collaborator,
      curriculum_document: myp_document,
      tenant: tenant,
      user: create(:user, tenant: tenant),
      assigned_by: admin,
      role: "specialist_contributor",
      contribution_mode: "rapid_attach",
      metadata: { "detail" => "Add one specialist note." }
    )
  end
  let!(:library_item) do
    create(
      :ib_specialist_library_item,
      tenant: tenant,
      school: school,
      created_by: admin,
      title: "Reusable inquiry provocation",
      summary: "A cross-grade launch routine."
    )
  end
  let!(:portfolio_collection) do
    create(
      :ib_portfolio_collection,
      tenant: tenant,
      school: school,
      student: admin,
      created_by: admin,
      title: "Growth showcase",
      visibility: "guardian_shared",
      item_refs: [ "ib_evidence_item:#{evidence_item.id}" ]
    )
  end
  let!(:standards_cycle) do
    create(:ib_standards_cycle, tenant: tenant, school: school, academic_year: academic_year, coordinator: admin)
  end
  let!(:standards_packet) do
    create(
      :ib_standards_packet,
      tenant: tenant,
      school: school,
      ib_standards_cycle: standards_cycle,
      owner: admin,
      title: "Evidence packet",
      evidence_strength: "emerging",
      export_status: "not_ready"
    )
  end
  let!(:guardian_link) do
    create(:guardian_link, tenant: tenant, guardian: admin, student: create(:user, tenant: tenant))
  end
  let!(:home_route_event) do
    create(
      :ib_activity_event,
      tenant: tenant,
      school: school,
      user: admin,
      event_name: "ib.route.view",
      event_family: "teacher_workflow",
      surface: "teacher_home",
      programme: "PYP",
      route_id: "ib.pyp.unit",
      entity_ref: Ib::RouteBuilder.entity_ref_for(pyp_document),
      metadata: {
        "label" => pyp_document.title,
        "detail" => "Recent work",
        "href" => Ib::RouteBuilder.href_for(pyp_document)
      }
    )
  end

  before do
    mock_session(admin, tenant: tenant)
    IbUserWorkspacePreference.write_value!(
      user: admin,
      school: school,
      surface: "teacher_home",
      context_key: "pins",
      preference_key: "teacher_home",
      programme: "Mixed",
      value: { entity_refs: [ Ib::RouteBuilder.entity_ref_for(pyp_document) ] }
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "returns phase 7 teacher home payload sections" do
    get "/api/v1/ib/home", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["pinned_items"]).not_to be_empty
    expect(response.parsed_body["due_today"]).not_to be_empty
    expect(response.parsed_body["recent_history"]).not_to be_empty
    expect(response.parsed_body["quick_mutations"]).not_to be_empty
    expect(response.parsed_body["benchmark_snapshot"]).not_to be_empty
    expect(response.parsed_body.dig("performance_budget", "budgets")).to be_an(Array)
  end

  it "returns phase 7 specialist dashboard sections" do
    get "/api/v1/ib/specialist", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["requested_contributions"]).not_to be_empty
    expect(response.parsed_body["pending_responses"]).not_to be_empty
    expect(response.parsed_body["evidence_to_sort"]).not_to be_empty
    expect(response.parsed_body["library_items"].first["title"]).to eq("Reusable inquiry provocation")
  end

  it "returns phase 7 coordinator intelligence payload sections" do
    get "/api/v1/ib/operations", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["data_mart"]).to include("documents", "evidence", "publishing")
    expect(response.parsed_body["programme_health_summary"]).to include("dp_risk_count")
    expect(response.parsed_body["myp_intelligence"]).to include("concept_balance", "context_balance")
    expect(response.parsed_body["dp_risk_summary"]).not_to be_empty
    expect(response.parsed_body["continuum_explorer"]).to include("PYP", "MYP")
    expect(response.parsed_body.dig("shareable_view", "share_token")).to be_present
  end

  it "returns phase 7 student and guardian payload sections" do
    get "/api/v1/ib/student", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["learning_timeline"]).not_to be_empty
    expect(response.parsed_body["goals"].first["title"]).to eq("Strengthen reflection quality")
    expect(response.parsed_body.dig("reflection_system", "prompts")).not_to be_empty
    expect(response.parsed_body.dig("portfolio", "collections")).not_to be_empty
    expect(response.parsed_body["release_gates"]).to include("timeline_ready")

    get "/api/v1/ib/guardian", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["current_unit_windows"]).not_to be_empty
    expect(response.parsed_body.dig("stories", 0, "translation_state")).to eq("reviewed")
    expect(response.parsed_body["student_options"]).not_to be_empty
    expect(response.parsed_body["digest_strategy"]).to include("cadence_options", "urgent_count")
    expect(response.parsed_body["preferences"]).to be_a(Hash)
  end

  it "creates activity events and workspace preferences" do
    post "/api/v1/ib/activity_events",
      params: {
        ib_activity_event: {
          event_name: "ib.command.execute",
          event_family: "search_and_navigation",
          surface: "search",
          programme: "PYP",
          route_id: "ib.home",
          entity_ref: "route:/ib/home",
          metadata: { label: "Open home" }
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(IbActivityEvent.where(event_name: "ib.command.execute")).to exist

    post "/api/v1/ib/workspace_preferences",
      params: {
        ib_user_workspace_preference: {
          surface: "teacher_home",
          context_key: "pins",
          preference_key: "teacher_home",
          value: { entity_refs: [ Ib::RouteBuilder.entity_ref_for(myp_document) ] }
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    preference = IbUserWorkspacePreference.find_by!(
      tenant: tenant,
      user: admin,
      school: school,
      surface: "teacher_home",
      context_key: "pins",
      preference_key: "teacher_home",
      scope_key: IbUserWorkspacePreference.scope_key_for(user: admin, school: school)
    )
    expect(preference.value.fetch("entity_refs")).to include(Ib::RouteBuilder.entity_ref_for(myp_document))
  end

  it "supports phase 7 search and autosave endpoints" do
    get "/api/v1/ib/search", params: { q: "showcase" }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("results").map { |row| row["title"] }).to include("Growth showcase")

    post "/api/v1/ib/section_autosaves",
      params: {
        curriculum_document_id: pyp_document.id,
        section_autosave: {
          title: "How the world works",
          base_version_id: pyp_document.current_version_id,
          content: {
            central_idea: "Systems shape communities.",
            family_support_prompt: "Ask what system changed this week.",
            learning_experiences: [
              { title: "Provocation", detail: "Notice visible systems." },
              { title: "Reflection", detail: "Capture the next shift." }
            ]
          }
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("saved")
    expect(pyp_document.reload.current_version_id).not_to eq(pyp_document_version.id)
  end
end
