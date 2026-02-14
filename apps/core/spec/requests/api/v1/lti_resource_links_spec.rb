require "rails_helper"

RSpec.describe "Api::V1::LtiResourceLinks", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
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
  let(:registration) do
    Current.tenant = tenant
    r = create(:lti_registration, tenant: tenant, created_by: admin)
    Current.tenant = nil
    r
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/lti_registrations/:lti_registration_id/lti_resource_links" do
    it "lists resource links for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:lti_resource_link, tenant: tenant, lti_registration: registration)
      Current.tenant = nil

      get "/api/v1/lti_registrations/#{registration.id}/lti_resource_links"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "lists resource links for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:lti_resource_link, tenant: tenant, lti_registration: registration)
      Current.tenant = nil

      get "/api/v1/lti_registrations/#{registration.id}/lti_resource_links"
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/lti_registrations/:lti_registration_id/lti_resource_links" do
    it "creates a resource link for admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/lti_registrations/#{registration.id}/lti_resource_links", params: {
        title: "Test Link",
        url: "https://tool.example.com/resource"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Test Link")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/lti_registrations/#{registration.id}/lti_resource_links", params: {
        title: "Test Link"
      }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/lti_registrations/:lti_registration_id/lti_resource_links/:id" do
    it "updates a resource link" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      link = create(:lti_resource_link, tenant: tenant, lti_registration: registration)
      Current.tenant = nil

      patch "/api/v1/lti_registrations/#{registration.id}/lti_resource_links/#{link.id}", params: {
        title: "Updated Link"
      }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Link")
    end
  end

  describe "DELETE /api/v1/lti_registrations/:lti_registration_id/lti_resource_links/:id" do
    it "deletes a resource link" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      link = create(:lti_resource_link, tenant: tenant, lti_registration: registration)
      Current.tenant = nil

      delete "/api/v1/lti_registrations/#{registration.id}/lti_resource_links/#{link.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
