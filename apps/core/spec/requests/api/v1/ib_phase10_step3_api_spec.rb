require "rails_helper"

RSpec.describe "Api::V1::Ib phase 10 mobile workflows", type: :request do
  let(:tenant) { create(:tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) { create(:user, tenant: tenant) }
  let(:headers) { { "HTTP_X_SCHOOL_ID" => school.id.to_s } }

  before do
    mock_session(teacher, tenant: tenant)
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "returns the mobile action inventory, deep links, and offline policy" do
    get "/api/v1/ib/mobile_hub", headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "role" => "teacher"
    )
    expect(response.parsed_body.fetch("primary_actions").map { |row| row.fetch("key") }).to include(
      "capture_evidence",
      "review_reflection"
    )
    expect(response.parsed_body.fetch("deep_links").map { |row| row.fetch("restore_key") }).to include(
      "evidence_triage"
    )
    expect(response.parsed_body.fetch("offline_policy")).to include(
      "resumable_uploads" => true,
      "attachment_retry" => true
    )
  end

  it "creates mobile evidence with an operational record link and attachment metadata" do
    operational_record = create(:ib_operational_record, tenant: tenant, school: school, owner: teacher)
    file = Rack::Test::UploadedFile.new(
      StringIO.new("fake image"),
      "image/png",
      false,
      original_filename: "capture.png"
    )

    post "/api/v1/ib/evidence_items",
      params: {
        ib_evidence_item: {
          school_id: school.id,
          ib_operational_record_id: operational_record.id,
          programme: "PYP",
          title: "Phone capture",
          summary: "Captured from the hallway.",
          next_action: "Validate before publish.",
          attachments: [ file ],
          metadata: { capture_mode: "camera", bandwidth_mode: "low" }
        }
      },
      headers: headers

    expect(response).to have_http_status(:created)
    expect(response.parsed_body).to include(
      "title" => "Phone capture",
      "ib_operational_record_id" => operational_record.id
    )
    expect(response.parsed_body.fetch("metadata")).to include(
      "capture_mode" => "camera"
    )
  end

  it "responds to and approves a reflection request from the mobile review flow" do
    evidence_item = create(
      :ib_evidence_item,
      tenant: tenant,
      school: school,
      created_by: teacher,
      student: student,
      programme: "PYP",
      status: "reflection_requested"
    )
    reflection_request = create(
      :ib_reflection_request,
      tenant: tenant,
      ib_evidence_item: evidence_item,
      requested_by: teacher,
      student: student,
      status: "requested"
    )

    patch "/api/v1/ib/reflection_requests/#{reflection_request.id}",
      params: {
        ib_reflection_request: {
          action: "respond",
          response_excerpt: "I used evidence from the field observation."
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "status" => "responded"
    )

    patch "/api/v1/ib/reflection_requests/#{reflection_request.id}",
      params: {
        ib_reflection_request: {
          action: "approve"
        }
      },
      headers: headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "status" => "approved",
      "approved_by_id" => teacher.id
    )
    expect(evidence_item.reload.status).to eq("validated")
  end
end
