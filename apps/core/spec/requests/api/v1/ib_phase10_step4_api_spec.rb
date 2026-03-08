require "rails_helper"

RSpec.describe "IB Phase 10 Step 4 collaboration", type: :request do
  let(:tenant) { create(:tenant, slug: "phase10-collaboration") }
  let(:school) { create(:school, tenant: tenant) }
  let(:teacher) { create(:user, tenant: tenant, email: "teacher-collab@example.com") }
  let(:reviewer) { create(:user, tenant: tenant, email: "reviewer-collab@example.com") }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, school: school, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course) }
  let(:planning_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: teacher
    )
  end
  let(:document) do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: teacher,
      document_type: "ib_pyp_unit",
      title: "Water systems",
      schema_key: "ib.pyp.unit@v2",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2"
    )
  end
  let(:headers) do
    {
      "X-Tenant-Slug" => tenant.slug,
      "X-School-Id" => school.id.to_s
    }
  end

  before do
    teacher.add_role(:teacher)
    teacher.add_role(:admin)
    reviewer.add_role(:teacher)
    reviewer.add_role(:admin)
    create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
    create(:enrollment, tenant: tenant, section: section, user: reviewer, role: "teacher")
    document.create_version!(
      title: document.title,
      content: { "overview" => "Students investigate how systems change." },
      created_by: teacher
    )
    create(
      :ib_document_comment,
      tenant: tenant,
      curriculum_document: document,
      author: teacher,
      comment_type: "suggestion",
      body: "Tighten the central idea.",
      metadata: { "diff" => { "field" => "central_idea" } }
    )
    create(
      :ib_collaboration_task,
      tenant: tenant,
      school: school,
      curriculum_document: document,
      created_by: teacher,
      assigned_to: reviewer,
      title: "Review family summary",
      detail: "Check translation and tone.",
      section_key: "family_window_summary"
    )
  end

  def sign_in(user, role: "teacher")
    post "/api/v1/testing/session",
      params: { email: user.email, tenant_slug: tenant.slug, role: role },
      headers: { "ACCEPT" => "application/json" }
    expect(response).to have_http_status(:ok)
  end

  it "surfaces topology, soft locks, suggestions, comments, and timeline entries" do
    sign_in(teacher)

    post "/api/v1/ib/collaboration_sessions",
      params: {
        curriculum_document_id: document.id,
        ib_collaboration_session: {
          session_key: "teacher-one",
          scope_type: "section",
          scope_key: "central_idea",
          role: "editor",
          metadata: { source: "document_editor" }
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)

    sign_in(reviewer)
    post "/api/v1/ib/collaboration_sessions",
      params: {
        curriculum_document_id: document.id,
        ib_collaboration_session: {
          session_key: "reviewer-one",
          scope_type: "section",
          scope_key: "central_idea",
          role: "editor",
          metadata: { source: "document_editor" }
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)
    expect(response.parsed_body["conflict_risk"]).to eq(true)

    post "/api/v1/ib/document_comments",
      params: {
        curriculum_document_id: document.id,
        ib_document_comment: {
          comment_type: "mention",
          body: "@teacher review the evidence paragraph",
          anchor_path: "sections.evidence_summary",
          metadata: { mention_user_ids: [ teacher.id ] }
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)
    created_comment_id = response.parsed_body.fetch("id")

    post "/api/v1/ib/collaboration_events",
      params: {
        ib_collaboration_event: {
          curriculum_document_id: document.id,
          event_name: "change_patch",
          route_id: "ib.document_studio",
          scope_key: "central_idea",
          section_key: "central_idea",
          durable: true,
          payload: { summary: "Updated inquiry language" }
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)

    get "/api/v1/ib/collaboration_workbench",
      params: { curriculum_document_id: document.id },
      headers: headers
    expect(response).to have_http_status(:ok)

    body = response.parsed_body
    expect(body["channel_topology"].map { |row| row["key"] }).to include("presence", "soft_locks", "suggestions")
    expect(body["soft_locks"].first["contested"]).to eq(true)
    expect(body["suggestions"].map { |row| row["body"] }).to include("Tighten the central idea.")
    expect(body["comment_threads"].map { |row| row["id"] }).to include(created_comment_id)
    expect(body["timeline"].map { |row| row["kind"] }).to include("event", "version")
    expect(body["permission_audit"]["can_edit"]).to eq(true)
    expect(body["teacher_success_benchmarks"]["suggestions_pending"]).to be >= 1
  end

  it "serializes threaded comments with resolution data" do
    sign_in(teacher)

    post "/api/v1/ib/document_comments",
      params: {
        curriculum_document_id: document.id,
        ib_document_comment: {
          comment_type: "general",
          body: "Please refine the support prompt."
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)
    parent_id = response.parsed_body.fetch("id")

    post "/api/v1/ib/document_comments",
      params: {
        curriculum_document_id: document.id,
        ib_document_comment: {
          comment_type: "general",
          parent_comment_id: parent_id,
          body: "I can handle this today."
        }
      },
      headers: headers
    expect(response).to have_http_status(:created)

    patch "/api/v1/ib/document_comments/#{parent_id}",
      params: { ib_document_comment: { status: "resolved" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("resolved")
    expect(response.parsed_body["resolved_at"]).to be_present

    get "/api/v1/ib/document_comments",
      params: { curriculum_document_id: document.id },
      headers: headers
    expect(response).to have_http_status(:ok)
    thread = response.parsed_body.find { |row| row["id"] == parent_id }
    expect(thread["reply_count"]).to eq(1)
    expect(thread["replies"].first["body"]).to eq("I can handle this today.")
  end
end
