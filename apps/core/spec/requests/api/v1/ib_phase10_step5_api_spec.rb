require "rails_helper"

RSpec.describe "IB Phase 10 Step 5 reporting", type: :request do
  let(:tenant) { create(:tenant, slug: "phase10-reporting") }
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:teacher) { create(:user, tenant: tenant, email: "teacher-reporting@example.com") }
  let(:student) { create(:user, tenant: tenant, email: "student-reporting@example.com") }
  let(:guardian) { create(:user, tenant: tenant, email: "guardian-reporting@example.com") }
  let(:headers) do
    {
      "X-Tenant-Slug" => tenant.slug,
      "X-School-Id" => school.id.to_s
    }
  end

  before do
    teacher.add_role(:teacher)
    teacher.add_role(:admin)
    student.add_role(:student)
    guardian.add_role(:guardian)
    create(:guardian_link, tenant: tenant, student: student, guardian: guardian, status: "active")

    create(
      :ib_report_cycle,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: teacher,
      owner: teacher,
      programme: "PYP",
      status: "open"
    )
    create(
      :ib_report_template,
      tenant: tenant,
      school: school,
      created_by: teacher,
      programme: "PYP",
      audience: "guardian",
      family: "conference_packet",
      status: "active"
    )

    create(
      :ib_learning_story,
      tenant: tenant,
      school: school,
      created_by: teacher,
      programme: "PYP",
      summary: "Students synthesized water-cycle observations.",
      support_prompt: "Ask what evidence changed their thinking.",
      metadata: { student_id: student.id }
    )
    create(
      :ib_evidence_item,
      tenant: tenant,
      school: school,
      student: student,
      created_by: teacher,
      programme: "PYP",
      title: "Field observation",
      summary: "Captured observation data.",
      metadata: { learner_profile: [ "Inquirer" ], atl_tags: [ "Research" ] }
    )
    create(
      :ib_operational_record,
      tenant: tenant,
      school: school,
      student: student,
      owner: teacher,
      programme: "DP",
      record_family: "dp_ia",
      title: "Biology IA",
      summary: "Draft analysis complete.",
      next_action: "Finalize methodology.",
      risk_level: "watch"
    )
  end

  def sign_in(user, role: nil)
    post "/api/v1/testing/session",
      params: { email: user.email, tenant_slug: tenant.slug, role: role },
      headers: { "ACCEPT" => "application/json" }
    expect(response).to have_http_status(:ok)
  end

  it "creates a canonical report contract with proofing, localization, archive, and render artifacts" do
    sign_in(teacher, role: "admin")

    post "/api/v1/ib/reports",
      params: {
        ib_report: {
          report_family: "conference_packet",
          audience: "guardian",
          student_id: student.id,
          title: "Conference packet"
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    body = response.parsed_body
    expect(body["report_contract"]).to include(
      "version" => "phase10.v1",
      "archive_enabled" => true
    )
    expect(body["localization"]).to include(
      "default_locale" => "en"
    )
    expect(body.dig("localization", "available_locales")).to include("es", "fr")
    expect(body["conference_packet"]).to include(
      "family_view_enabled" => true
    )
    expect(body.dig("archive_entry", "storage_backend")).to eq("active_storage")
    expect(body.dig("current_version", "render_payload", "artifact_bundle", "pdf_url")).to include("/artifacts/reports/")
    expect(body.dig("proofing_summary", "preflight_warnings")).to be_an(Array)
  end

  it "supports sign-off, release, delivery, and guardian acknowledgement state" do
    sign_in(teacher, role: "admin")

    post "/api/v1/ib/reports",
      params: {
        ib_report: {
          report_family: "conference_packet",
          audience: "guardian",
          student_id: student.id
        }
      },
      headers: headers
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
      params: {
        ib_report: {
          action: "deliver",
          audience_role: "guardian",
          recipient_id: guardian.id,
          locale: "es",
          channel: "pdf"
        }
      },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("deliveries", 0, "artifact_url")).to include(".pdf")
    expect(response.parsed_body.dig("deliveries", 0, "archive_key")).to include("guardian/es")

    sign_in(guardian, role: "guardian")

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "mark_read" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("deliveries", 0, "status")).to eq("read")

    patch "/api/v1/ib/reports/#{report_id}",
      params: { ib_report: { action: "acknowledge" } },
      headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("analytics", "acknowledgement_rate")).to be >= 100.0
  end

  it "returns the phase 10 reporting command contract from report cycles" do
    sign_in(teacher, role: "admin")

    get "/api/v1/ib/report_cycles", headers: headers

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body["canonical_contract"]).to include(
      "version" => "phase10.v1"
    )
    expect(body["proofing_queue"]).to be_an(Array)
    expect(body["localization_pipeline"]).to be_an(Array)
    expect(body["archive_summary"]).to include("artifact_retention" => "7y")
    expect(body["analytics_summary"]).to have_key("open_rate")
  end
end
