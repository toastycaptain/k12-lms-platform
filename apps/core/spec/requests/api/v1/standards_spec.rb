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
  end
end
