require "rails_helper"

RSpec.describe "Api::V1::Ib phase 8 endpoints", type: :request do
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
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Sam", last_name: "Student")
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Grace", last_name: "Guardian")
    user.add_role(:guardian)
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
  let!(:document_version) do
    version = create(
      :curriculum_document_version,
      curriculum_document: document,
      tenant: tenant,
      created_by: admin,
      title: document.title,
      content: {
        "central_idea" => "Systems shape communities.",
        "learning_experiences" => [ { "title" => "Provocation", "detail" => "Start with a live system." } ]
      }
    )
    document.update!(current_version_id: version.id)
    version
  end
  let!(:guardian_link) { create(:guardian_link, tenant: tenant, guardian: guardian, student: student) }
  let!(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let!(:course) { create(:course, tenant: tenant, school: school, academic_year: academic_year) }
  let!(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let!(:student_enrollment) do
    create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
  end
  let!(:story) do
    create(
      :ib_learning_story,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      programme: "PYP",
      title: "Systems in action",
      summary: "A narrative about systems thinking.",
      support_prompt: "Ask what changed in the system this week.",
      state: "published",
      metadata: { "student_id" => student.id.to_s, "student_ids" => [ student.id.to_s ] }
    )
  end
  let!(:evidence_item) do
    create(
      :ib_evidence_item,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      curriculum_document: document,
      student: student,
      created_by: admin,
      programme: "PYP",
      title: "Reflection capture",
      summary: "Evidence tied to systems learning.",
      status: "validated",
      visibility: "guardian_visible",
      metadata: { "learner_profile" => [ "reflective" ], "atl_tags" => [ "research" ] }
    )
  end
  let!(:operational_record) do
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      student: student,
      programme: "DP",
      record_family: "dp_ee",
      title: "Extended essay checkpoint",
      next_action: "Finish the next draft.",
      due_on: Date.current + 5.days
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

  it "returns and verifies the phase 8 release baseline payload" do
    get "/api/v1/ib/release_baseline", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("release_channel", "checklist", "blockers")

    post "/api/v1/ib/release_baseline/verify", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to be_in(%w[verified failed])
    expect(response.parsed_body["checklist"]).to include("pack_version", "ci_matrix", "migration_rehearsal")
  end

  it "creates a source-specific import batch and produces a dry-run preview" do
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
          raw_payload: "planning_context_name,title,document_type,schema_key,statement_of_inquiry\nGrade 5 PYP,Imported Unit,ib_pyp_unit,ib.pyp.unit@v2,How systems connect"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    batch_id = response.parsed_body.fetch("id")
    expect(response.parsed_body["source_system"]).to eq("managebac")
    expect(response.parsed_body["import_mode"]).to eq("draft")

    post "/api/v1/ib/import_batches/#{batch_id}/dry_run", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("preview_summary", "source_system")).to eq("managebac")
    expect(response.parsed_body.dig("preview_summary", "object_counts")).to be_a(Hash)
    expect(response.parsed_body["rollback_capabilities"]).to be_a(Hash)
  end

  it "generates, releases, delivers, and records guardian report consumption state" do
    post "/api/v1/ib/reports",
      params: {
        ib_report: {
          report_family: "pyp_narrative",
          student_id: student.id,
          audience: "guardian"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    report_id = response.parsed_body.fetch("id")

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "sign_off" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("signed_off")

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "release" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("released")

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "deliver", audience_role: "guardian", channel: "web" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("deliveries")).not_to be_empty

    mock_session(guardian, tenant: tenant)

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "mark_read" } },
      headers: headers
    expect(response).to have_http_status(:ok)

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "acknowledge" } },
      headers: headers
    expect(response).to have_http_status(:ok)

    receipt = IbDeliveryReceipt.find_by!(
      tenant: tenant,
      user: guardian,
      deliverable_type: "IbReport",
      deliverable_id: report_id,
      audience_role: "guardian"
    )
    expect(receipt.state).to eq("acknowledged")

    get "/api/v1/ib/guardian", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["released_reports"].map { |row| row["id"] }).to include(report_id)
    expect(response.parsed_body["delivery_receipts"].map { |row| row["state"] }).to include("acknowledged")
  end

  it "supports collaboration sessions plus task-style comment search" do
    post "/api/v1/ib/document_comments",
      params: {
        curriculum_document_id: document.id,
        ib_document_comment: {
          comment_type: "task",
          visibility: "internal",
          body: "Task: align the next reflection prompt to this unit."
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body["comment_type"]).to eq("task")

    post "/api/v1/ib/collaboration_sessions",
      params: {
        curriculum_document_id: document.id,
        ib_collaboration_session: {
          session_key: "teacher-web-1",
          scope_type: "document",
          scope_key: "root",
          role: "editor",
          device_label: "web"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body["active_sessions"]).not_to be_empty

    get "/api/v1/ib/search", params: { q: "align the next reflection" }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("results").map { |row| row["kind"] }).to include("task")
  end

  it "persists saved searches and communication preferences" do
    post "/api/v1/ib/saved_searches",
      params: {
        ib_saved_search: {
          name: "IA risk lens",
          query: "risk extended essay",
          lens_key: "coordinator_lens",
          scope_key: "ib"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    saved_search_id = response.parsed_body.fetch("id")
    expect(response.parsed_body["share_token"]).to be_present

    patch "/api/v1/ib/saved_searches/#{saved_search_id}",
      params: { ib_saved_search: { metadata: { owner: "coordinator" } } },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("metadata", "owner")).to eq("coordinator")

    patch "/api/v1/ib/communication_preferences",
      params: {
        audience: "guardian",
        ib_communication_preference: {
          digest_cadence: "fortnightly",
          quiet_hours_start: "21:00",
          quiet_hours_end: "06:00"
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["digest_cadence"]).to eq("fortnightly")
    expect(response.parsed_body["quiet_hours_start"]).to eq("21:00")
  end
end
