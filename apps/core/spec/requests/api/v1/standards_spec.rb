require "rails_helper"

RSpec.describe "Api::V1::Standards", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/standard_frameworks" do
    it "returns all frameworks" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create_list(:standard_framework, 2, tenant: tenant)
      Current.tenant = nil

      get "/api/v1/standard_frameworks"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end

  describe "POST /api/v1/standard_frameworks" do
    it "creates a framework" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/standard_frameworks", params: {
        standard_framework: { name: "CCSS Math", jurisdiction: "National", subject: "Math", version: "2024" }
      }

      expect(response).to have_http_status(:created)
    end
  end

  describe "CRUD /api/v1/standards" do
    it "creates a standard" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant)
      Current.tenant = nil

      post "/api/v1/standards", params: {
        standard: { standard_framework_id: framework.id, code: "1.OA.1", description: "Add and subtract", grade_band: "K-2" }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["code"]).to eq("1.OA.1")
    end

    it "creates a generic node with identifier and kind" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant, framework_kind: "skill")
      Current.tenant = nil

      post "/api/v1/standards", params: {
        standard: {
          standard_framework_id: framework.id,
          code: nil,
          identifier: "IB-ATL-COMM",
          label: "Communication",
          kind: "skill",
          description: "Communication ATL skill"
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["identifier"]).to eq("IB-ATL-COMM")
      expect(response.parsed_body["kind"]).to eq("skill")
    end

    it "creates a nested standard" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant)
      parent = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA")
      Current.tenant = nil

      post "/api/v1/standards", params: {
        standard: { standard_framework_id: framework.id, parent_id: parent.id, code: "1.OA.1", description: "Add within 20" }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["parent_id"]).to eq(parent.id)
    end

    it "supports full-text search with filters" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant)
      matching = create(:standard, tenant: tenant, standard_framework: framework, code: "MATH.FRACTION.1", kind: "standard", grade_band: "3-5", description: "Fractions and decimals")
      _other_kind = create(:standard, tenant: tenant, standard_framework: framework, code: "MATH.FRACTION.2", kind: "skill", grade_band: "3-5", description: "Fractions practice skill")
      create(:standard, tenant: tenant, standard_framework: framework, code: "ELA.1", kind: "standard", grade_band: "K-2", description: "Reading fluency")
      Current.tenant = nil

      get "/api/v1/standards", params: {
        q: "fraction",
        standard_framework_id: framework.id,
        kind: "standard",
        grade_band: "3-5"
      }

      expect(response).to have_http_status(:ok)
      ids = response.parsed_body.map { |row| row["id"] }
      expect(ids).to eq([ matching.id ])
    end
  end

  describe "GET /api/v1/standard_frameworks/:id/tree" do
    it "returns the standard tree for a framework" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant)
      root = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA")
      create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.1", parent: root)
      create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.2", parent: root)
      Current.tenant = nil

      get "/api/v1/standard_frameworks/#{framework.id}/tree"

      expect(response).to have_http_status(:ok)
      tree = response.parsed_body
      expect(tree.length).to eq(1)
      expect(tree.first["code"]).to eq("1.OA")
      expect(tree.first["children"].length).to eq(2)
    end

    it "filters the tree by node kind" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      framework = create(:standard_framework, tenant: tenant)
      create(:standard, tenant: tenant, standard_framework: framework, code: "SK.1", kind: "skill")
      create(:standard, tenant: tenant, standard_framework: framework, code: "STD.1", kind: "standard")
      Current.tenant = nil

      get "/api/v1/standard_frameworks/#{framework.id}/tree", params: { kind: "skill" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["kind"] }).to eq([ "skill" ])
    end
  end
end
