require "rails_helper"

RSpec.describe "Api::V1::AiTemplates", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_templates" do
    it "returns all templates for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, status: "draft")
      create(:ai_template, tenant: tenant, created_by: admin, status: "active",
        name: "Active Template", task_type: "unit_generation")
      Current.tenant = nil

      get "/api/v1/ai_templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end

    it "returns only active templates for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, status: "draft")
      create(:ai_template, tenant: tenant, created_by: admin, status: "active",
        name: "Active Template", task_type: "unit_generation")
      Current.tenant = nil

      get "/api/v1/ai_templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("active")
    end

    it "filters by task_type" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, task_type: "lesson_generation")
      create(:ai_template, tenant: tenant, created_by: admin, task_type: "unit_generation",
        name: "Unit Gen Template")
      Current.tenant = nil

      get "/api/v1/ai_templates", params: { task_type: "lesson_generation" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["task_type"]).to eq("lesson_generation")
    end

    it "filters by status" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, status: "draft")
      create(:ai_template, tenant: tenant, created_by: admin, status: "active",
        name: "Active Template", task_type: "unit_generation")
      Current.tenant = nil

      get "/api/v1/ai_templates", params: { status: "active" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("active")
    end
  end

  describe "POST /api/v1/ai_templates" do
    it "creates a template as admin" do
      mock_session(admin, tenant: tenant)

      expect {
        post "/api/v1/ai_templates", params: {
          task_type: "lesson_generation",
          name: "My Template",
          system_prompt: "You are a helpful assistant.",
          user_prompt_template: "Create a lesson about {{topic}}.",
          variables: [ { name: "topic", description: "The topic", required: true } ]
        }
      }.to change(AiTemplate.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("My Template")
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/ai_templates", params: {
        task_type: "lesson_generation",
        name: "My Template",
        system_prompt: "You are a helpful assistant.",
        user_prompt_template: "Create a lesson about {{topic}}."
      }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/ai_templates/:id" do
    it "shows a template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:ai_template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_templates/#{template.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(template.id)
    end
  end

  describe "PATCH /api/v1/ai_templates/:id" do
    it "updates a template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:ai_template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      patch "/api/v1/ai_templates/#{template.id}", params: {
        name: "Updated Template Name"
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["name"]).to eq("Updated Template Name")
    end
  end

  describe "DELETE /api/v1/ai_templates/:id" do
    it "deletes a template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:ai_template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      expect {
        delete "/api/v1/ai_templates/#{template.id}"
      }.to change(AiTemplate.unscoped, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  describe "POST /api/v1/ai_templates/:id/activate" do
    it "activates a template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:ai_template, tenant: tenant, created_by: admin, status: "draft")
      Current.tenant = nil

      post "/api/v1/ai_templates/#{template.id}/activate"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end
  end

  describe "POST /api/v1/ai_templates/:id/archive" do
    it "archives a template" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      template = create(:ai_template, tenant: tenant, created_by: admin, status: "active")
      Current.tenant = nil

      post "/api/v1/ai_templates/#{template.id}/archive"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("archived")
    end
  end
end
