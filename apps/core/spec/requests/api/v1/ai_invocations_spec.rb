require "rails_helper"

RSpec.describe "Api::V1::AiInvocations", type: :request do
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

  describe "GET /api/v1/ai_invocations" do
    it "returns invocations for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider)
      Current.tenant = nil

      get "/api/v1/ai_invocations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai_invocations"

      expect(response).to have_http_status(:forbidden)
    end

    it "filters by task_type" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        task_type: "lesson_generation")
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        task_type: "unit_generation")
      Current.tenant = nil

      get "/api/v1/ai_invocations", params: { task_type: "lesson_generation" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["task_type"]).to eq("lesson_generation")
    end

    it "filters by status" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        status: "completed")
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        status: "failed", task_type: "unit_generation")
      Current.tenant = nil

      get "/api/v1/ai_invocations", params: { status: "completed" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["status"]).to eq("completed")
    end
  end

  describe "GET /api/v1/ai_invocations/:id" do
    it "shows an invocation" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      invocation = create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider)
      Current.tenant = nil

      get "/api/v1/ai_invocations/#{invocation.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["id"]).to eq(invocation.id)
    end
  end

  describe "GET /api/v1/ai_invocations/summary" do
    it "returns summary for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        task_type: "lesson_generation", total_tokens: 100)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        task_type: "lesson_generation", total_tokens: 200)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider,
        task_type: "unit_generation", total_tokens: 150, provider_name: "anthropic")
      Current.tenant = nil

      get "/api/v1/ai_invocations/summary"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["total_invocations"]).to eq(3)
      expect(body["total_tokens"]).to eq(450)
      expect(body["by_task_type"]["lesson_generation"]).to eq(2)
      expect(body["by_task_type"]["unit_generation"]).to eq(1)
      expect(body["by_provider"]["openai"]).to eq(2)
      expect(body["by_provider"]["anthropic"]).to eq(1)
    end

    it "returns 403 for teacher" do
      mock_session(teacher, tenant: tenant)

      get "/api/v1/ai_invocations/summary"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
