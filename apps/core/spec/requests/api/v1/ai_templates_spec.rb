require "rails_helper"

RSpec.describe "Api::V1::AiTemplates", type: :request do
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

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/ai_templates" do
    it "lists templates for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "shows only active templates for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, status: "active")
      create(:ai_template, tenant: tenant, created_by: admin, status: "draft", name: "Draft Template")
      Current.tenant = nil

      get "/api/v1/ai_templates"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/ai_templates" do
    it "creates a template as admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/ai_templates", params: {
        name: "Lesson Helper",
        task_type: "lesson_plan",
        system_prompt: "You help teachers create lesson plans.",
        user_prompt_template: "Create a lesson plan for {subject}.",
        status: "draft"
      }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("Lesson Helper")
    end

    it "denies creation for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/ai_templates", params: {
        name: "Teacher Template",
        task_type: "lesson_plan",
        system_prompt: "test",
        user_prompt_template: "test"
      }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
