require "rails_helper"

RSpec.describe "Api::V1::Lti::Ags", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:registration) do
    Current.tenant = tenant
    r = create(:lti_registration, tenant: tenant, created_by: admin, status: "active")
    Current.tenant = nil
    r
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let(:valid_token) do
    LtiAgsService.generate_access_token(
      registration,
      [ LtiAgsService::SCOPE_LINEITEM, LtiAgsService::SCOPE_RESULT_READONLY, LtiAgsService::SCOPE_SCORE ]
    )
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/lti/ags/lineitems" do
    it "lists line items with valid token" do
      Current.tenant = tenant
      create(:assignment, tenant: tenant, course: course, created_by: admin)
      Current.tenant = nil

      # We need tenant_id in the token for AGS
      token = JWT.encode(
        { tenant_id: tenant.id, scopes: [ LtiAgsService::SCOPE_LINEITEM ], exp: 1.hour.from_now.to_i },
        LtiService.platform_keypair,
        "RS256"
      )

      get "/api/v1/lti/ags/lineitems", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 401 without token" do
      get "/api/v1/lti/ags/lineitems"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/lti/ags/lineitems/:id" do
    it "shows a single line item" do
      Current.tenant = tenant
      assignment = create(:assignment, tenant: tenant, course: course, created_by: admin)
      Current.tenant = nil

      token = JWT.encode(
        { tenant_id: tenant.id, scopes: [ LtiAgsService::SCOPE_LINEITEM ], exp: 1.hour.from_now.to_i },
        LtiService.platform_keypair,
        "RS256"
      )

      get "/api/v1/lti/ags/lineitems/#{assignment.id}", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["label"]).to eq(assignment.title)
    end
  end

  describe "GET /api/v1/lti/ags/lineitems/:id/results" do
    it "returns results for a line item" do
      Current.tenant = tenant
      assignment = create(:assignment, tenant: tenant, course: course, created_by: admin, status: "published")
      student = create(:user, tenant: tenant)
      create(:submission, tenant: tenant, assignment: assignment, user: student, status: "graded", grade: 85)
      Current.tenant = nil

      token = JWT.encode(
        { tenant_id: tenant.id, scopes: [ LtiAgsService::SCOPE_RESULT_READONLY ], exp: 1.hour.from_now.to_i },
        LtiService.platform_keypair,
        "RS256"
      )

      get "/api/v1/lti/ags/lineitems/#{assignment.id}/results", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["resultScore"]).to eq(85.0)
    end
  end

  describe "POST /api/v1/lti/ags/lineitems/:id/scores" do
    it "posts a score and creates/updates submission" do
      Current.tenant = tenant
      assignment = create(:assignment, tenant: tenant, course: course, created_by: admin, status: "published", points_possible: 100)
      student = create(:user, tenant: tenant)
      Current.tenant = nil

      token = JWT.encode(
        { tenant_id: tenant.id, scopes: [ LtiAgsService::SCOPE_SCORE ], exp: 1.hour.from_now.to_i },
        LtiService.platform_keypair,
        "RS256"
      )

      post "/api/v1/lti/ags/lineitems/#{assignment.id}/scores",
        params: { userId: student.id, scoreGiven: 90 },
        headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body).to have_key("resultUrl")
    end
  end
end
