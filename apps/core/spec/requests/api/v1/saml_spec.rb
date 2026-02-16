require "rails_helper"

RSpec.describe "Api::V1::Saml", type: :request do
  let!(:tenant) { create(:tenant, slug: "north-district") }

  describe "GET /api/v1/saml/metadata" do
    it "returns metadata XML with issuer and ACS URL" do
      get "/api/v1/saml/metadata", params: { tenant: tenant.slug }

      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("application/xml")
      expect(response.body).to include("k12-lms-#{tenant.slug}")
      expect(response.body).to include("/auth/saml/callback?tenant=#{tenant.slug}")
    end

    it "returns 400 when tenant is missing" do
      get "/api/v1/saml/metadata"

      expect(response).to have_http_status(:bad_request)
      expect(response.body).to include("Tenant required")
    end

    it "returns 404 for an unknown tenant" do
      get "/api/v1/saml/metadata", params: { tenant: "unknown-tenant" }

      expect(response).to have_http_status(:not_found)
      expect(response.body).to include("Tenant not found")
    end
  end
end
