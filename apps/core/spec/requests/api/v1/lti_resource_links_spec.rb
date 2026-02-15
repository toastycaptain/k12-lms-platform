require "rails_helper"

RSpec.describe "Api::V1::LtiResourceLinks", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:registration) do
    Current.tenant = tenant
    record = create(:lti_registration, tenant: tenant, created_by: admin)
    Current.tenant = nil
    record
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  let(:base_params) do
    {
      lti_resource_link: {
        title: "Launch Tool",
        description: "Course launch link",
        url: "https://tool.example.com/launch",
        course_id: course.id,
        custom_params: { key: "value" }
      }
    }
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/lti_registrations/:id/lti_resource_links" do
    it "allows teachers to list links" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:lti_resource_link, tenant: tenant, lti_registration: registration, title: "Class Link")
      Current.tenant = nil

      get "/api/v1/lti_registrations/#{registration.id}/lti_resource_links"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.first["title"]).to eq("Class Link")
    end
  end

  describe "POST /api/v1/lti_registrations/:id/lti_resource_links" do
    it "creates a link for admins" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/lti_registrations/#{registration.id}/lti_resource_links", params: base_params
      }.to change(LtiResourceLink.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Launch Tool")
    end

    it "returns forbidden for teachers" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/lti_registrations/#{registration.id}/lti_resource_links", params: base_params

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/lti_registrations/:id/lti_resource_links/:link_id" do
    it "updates a link for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      link = create(:lti_resource_link, tenant: tenant, lti_registration: registration, title: "Old")
      Current.tenant = nil

      patch "/api/v1/lti_registrations/#{registration.id}/lti_resource_links/#{link.id}", params: {
        lti_resource_link: { title: "Updated" }
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated")
    end
  end

  describe "DELETE /api/v1/lti_registrations/:id/lti_resource_links/:link_id" do
    it "deletes a link for admins" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      link = create(:lti_resource_link, tenant: tenant, lti_registration: registration, title: "Delete Me")
      Current.tenant = nil

      expect {
        delete "/api/v1/lti_registrations/#{registration.id}/lti_resource_links/#{link.id}"
      }.to change(LtiResourceLink.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
