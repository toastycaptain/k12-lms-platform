require "rails_helper"

RSpec.describe "Api::V1::LtiResourceLinksLookup", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:guardian)
    Current.tenant = nil
    user
  end

  let(:registration) { create(:lti_registration, tenant: tenant, created_by: teacher) }
  let(:link) { create(:lti_resource_link, tenant: tenant, lti_registration: registration, title: "External Tool") }

  after { Current.tenant = nil }

  describe "GET /api/v1/lti_resource_links/:id" do
    it "returns link details for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/lti_resource_links/#{link.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(link.id)
      expect(response.parsed_body["title"]).to eq("External Tool")
    end

    it "returns link details for student" do
      mock_session(student, tenant: tenant)

      get "/api/v1/lti_resource_links/#{link.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(link.id)
    end

    it "returns 403 for unsupported role" do
      mock_session(guardian, tenant: tenant)

      get "/api/v1/lti_resource_links/#{link.id}"

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 404 when record is missing" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/lti_resource_links/999999"

      expect(response).to have_http_status(:not_found)
    end

    it "returns 401 when unauthenticated" do
      get "/api/v1/lti_resource_links/#{link.id}"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
