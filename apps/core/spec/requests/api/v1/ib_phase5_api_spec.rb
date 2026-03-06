require "rails_helper"

RSpec.describe "Api::V1::Ib phase 5 endpoints", type: :request do
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
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:school) { create(:school, tenant: tenant) }
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

  it "resolves legacy plan hrefs to canonical IB routes" do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_dp_course_map",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.dp.course_map@v2"
    )

    get "/api/v1/ib/resolve", params: { href: "/plan/documents/#{document.id}" }, headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["status"]).to eq("deprecated_redirect")
    expect(response.parsed_body["redirect_to"]).to eq("/ib/dp/course-maps/#{document.id}")
  end

  it "returns filtered evidence summary counts" do
    create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin, programme: "PYP", status: "needs_validation")
    linked_item = create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin, programme: "PYP", status: "linked_to_story", visibility: "family_ready")
    story = create(:ib_learning_story, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)
    IbLearningStoryEvidenceItem.create!(tenant: tenant, ib_learning_story: story, ib_evidence_item: linked_item)
    create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin, programme: "DP")

    get "/api/v1/ib/evidence_items/summary", params: { programme: "PYP" }, headers: headers

    expect(response).to have_http_status(:ok)
    counts = response.parsed_body.fetch("counts")
    expect(counts["total"]).to eq(2)
    expect(counts["needs_validation"]).to eq(1)
    expect(counts["linked_to_story"]).to eq(1)
    expect(counts["family_ready"]).to eq(1)
    expect(counts["unlinked"]).to eq(1)
  end

  it "creates school-scoped programme settings via the update endpoint" do
    patch "/api/v1/ib/programme_settings", params: {
      ib_programme_setting: {
        programme: "PYP",
        cadence_mode: "fortnightly",
        review_owner_role: "coordinator",
        thresholds: { approval_sla_days: 7 }
      }
    }, headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body["programme"]).to eq("PYP")
    expect(response.parsed_body["scope_level"]).to eq("school")
    expect(response.parsed_body.dig("thresholds", "approval_sla_days")).to eq(7)
  end

  it "supports standards packet detail actions and previews" do
    prior_cycle = create(:ib_standards_cycle, tenant: tenant, school: school, academic_year: academic_year, coordinator: admin, created_at: 1.month.ago)
    current_cycle = create(:ib_standards_cycle, tenant: tenant, school: school, academic_year: academic_year, coordinator: admin)
    previous_packet = create(:ib_standards_packet, tenant: tenant, school: school, ib_standards_cycle: prior_cycle, owner: admin, code: "A.1", title: "Previous Packet", review_state: "approved")
    packet = create(:ib_standards_packet, tenant: tenant, school: school, ib_standards_cycle: current_cycle, owner: admin, code: "A.1", title: "Current Packet")
    source_item = create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)
    create(:ib_standards_packet_item, tenant: tenant, ib_standards_packet: packet, source_id: source_item.id)

    get "/api/v1/ib/standards_packets/#{packet.id}/export_preview", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("preview", "packet", "id")).to eq(packet.id)

    get "/api/v1/ib/standards_packets/#{packet.id}/comparison", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("previous_packet", "id")).to eq(previous_packet.id)

    post "/api/v1/ib/standards_packets/#{packet.id}/assign_reviewer", params: { reviewer_id: admin.id }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["reviewer_id"]).to eq(admin.id)

    post "/api/v1/ib/standards_packets/#{packet.id}/approve", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["review_state"]).to eq("approved")

    post "/api/v1/ib/standards_packets/#{packet.id}/return_packet", params: { reason: "Need stronger evidence." }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body["review_state"]).to eq("returned")
    expect(response.parsed_body.dig("metadata", "return_reason")).to eq("Need stronger evidence.")

    post "/api/v1/ib/standards_packets/#{packet.id}/export", headers: headers
    expect(response).to have_http_status(:accepted)
    expect(response.parsed_body["status"]).to eq("queued")
  end
end
