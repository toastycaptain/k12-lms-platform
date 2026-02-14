require "rails_helper"

RSpec.describe "Api::V1::Templates", type: :request do
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

  describe "GET /api/v1/templates" do
    it "returns all templates for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:template, tenant: tenant, created_by: admin, status: "draft")
      create(:template, tenant: tenant, created_by: admin, status: "published")
      Current.tenant = nil

      get "/api/v1/templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns only published templates for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:template, tenant: tenant, created_by: admin, status: "draft")
      create(:template, tenant: tenant, created_by: admin, status: "published")
      Current.tenant = nil

      get "/api/v1/templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("published")
    end
  end

  describe "GET /api/v1/templates/:id" do
    it "returns a template" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/templates/#{template.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq(template.name)
    end
  end

  describe "POST /api/v1/templates" do
    it "creates a template with initial version for curriculum lead" do
      mock_session(curriculum_lead, tenant: tenant)

      expect {
        post "/api/v1/templates", params: {
          template: { name: "UbD Unit Template", subject: "Math", grade_level: "9-12" }
        }
      }.to change(Template.unscoped, :count).by(1)
        .and change(TemplateVersion.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["current_version_id"]).to be_present
      expect(body["created_by_id"]).to eq(curriculum_lead.id)
    end

    it "denies template creation for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/templates", params: {
        template: { name: "Unauthorized Template" }
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PATCH /api/v1/templates/:id" do
    it "updates a template for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/templates/#{template.id}", params: { template: { name: "Updated Name" } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated Name")
    end

    it "denies update for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/templates/#{template.id}", params: { template: { name: "Hacked" } }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/v1/templates/:id" do
    it "deletes a template for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        delete "/api/v1/templates/#{template.id}"
      }.to change(Template.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "denies deletion for curriculum lead" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead)
      Current.tenant = nil

      delete "/api/v1/templates/#{template.id}"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/templates/:id/create_version" do
    it "creates a new version" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead)
      template.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/templates/#{template.id}/create_version", params: {
        version: {
          title: "Revised Template",
          description: "Updated description",
          essential_questions: [ "Why?" ],
          enduring_understandings: [ "Because..." ]
        }
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["version_number"]).to eq(2)
      expect(response.parsed_body["essential_questions"]).to eq([ "Why?" ])
    end
  end

  describe "GET /api/v1/templates/:id/versions" do
    it "returns all versions ordered by version_number desc" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead)
      template.create_version!(title: "v1")
      template.create_version!(title: "v2")
      Current.tenant = nil

      get "/api/v1/templates/#{template.id}/versions"

      expect(response).to have_http_status(:ok)
      versions = response.parsed_body
      expect(versions.length).to eq(2)
      expect(versions.first["version_number"]).to eq(2)
    end
  end

  describe "POST /api/v1/templates/:id/publish" do
    it "publishes a draft template with a current version" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead, status: "draft")
      template.create_version!(title: "v1")
      Current.tenant = nil

      post "/api/v1/templates/#{template.id}/publish"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("published")
    end

    it "returns error when template is already published" do
      mock_session(curriculum_lead, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: curriculum_lead, status: "published")
      Current.tenant = nil

      post "/api/v1/templates/#{template.id}/publish"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /api/v1/templates/:id/archive" do
    it "archives a published template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin, status: "published")
      Current.tenant = nil

      post "/api/v1/templates/#{template.id}/archive"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("archived")
    end

    it "returns error when template is not published" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:template, tenant: tenant, created_by: admin, status: "draft")
      Current.tenant = nil

      post "/api/v1/templates/#{template.id}/archive"

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
