require "rails_helper"

RSpec.describe "Api::V1::StandardFrameworks", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:curriculum_lead) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:curriculum_lead)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "admin permissions" do
    it "allows create/update/destroy" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/standard_frameworks", params: {
        standard_framework: {
          name: "CCSS",
          key: "ccss_math",
          framework_kind: "standard",
          jurisdiction: "US",
          subject: "Math",
          version: "2026",
          status: "active",
          metadata: { source: "import" }
        }
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["framework_kind"]).to eq("standard")
      expect(response.parsed_body["key"]).to eq("ccss_math")
      framework_id = response.parsed_body["id"]

      patch "/api/v1/standard_frameworks/#{framework_id}", params: { standard_framework: { version: "2027" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/standard_frameworks/#{framework_id}"
      expect(response).to have_http_status(:no_content)
    end

    it "filters frameworks by kind and status" do
      mock_session(admin, tenant: tenant)
      create(:standard_framework, tenant: tenant, framework_kind: "standard", status: "active", name: "A")
      create(:standard_framework, tenant: tenant, framework_kind: "skill", status: "archived", name: "B")

      get "/api/v1/standard_frameworks", params: { framework_kind: "skill", status: "archived" }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body.size).to eq(1)
      expect(body.first["framework_kind"]).to eq("skill")
      expect(body.first["status"]).to eq("archived")
    end
  end

  describe "curriculum lead permissions" do
    it "allows create/update but forbids destroy" do
      mock_session(curriculum_lead, tenant: tenant)
      framework = create(:standard_framework, tenant: tenant)

      post "/api/v1/standard_frameworks", params: { standard_framework: { name: "State Std", jurisdiction: "US", subject: "ELA", version: "1" } }
      expect(response).to have_http_status(:created)

      patch "/api/v1/standard_frameworks/#{framework.id}", params: { standard_framework: { version: "2" } }
      expect(response).to have_http_status(:ok)

      delete "/api/v1/standard_frameworks/#{framework.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "teacher restrictions" do
    it "forbids create" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/standard_frameworks", params: { standard_framework: { name: "Nope", jurisdiction: "US", subject: "Sci", version: "1" } }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
