require "rails_helper"

RSpec.describe "Api::V1::Addon", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:addon_token) { "workspace-addon-token" }
  let(:auth_headers) { { "Authorization" => "Bearer #{addon_token}" } }

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end

  let!(:addon_config) do
    Current.tenant = tenant
    config = create(
      :integration_config,
      tenant: tenant,
      created_by: admin,
      provider: "google_workspace",
      status: "active",
      settings: {
        "addon_token" => addon_token,
        "service_user_id" => teacher.id
      }
    )
    Current.tenant = nil
    config
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "GET /api/v1/addon/unit_plans" do
    it "returns unit plans for authenticated addon user" do
      Current.tenant = tenant
      academic_year = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: academic_year)
      create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Fractions Unit")
      Current.tenant = nil

      get "/api/v1/addon/unit_plans", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |row| row["title"] }).to include("Fractions Unit")
    end
  end

  describe "GET /api/v1/addon/standards" do
    it "returns standards filtered by framework" do
      Current.tenant = tenant
      framework_a = create(:standard_framework, tenant: tenant, name: "Common Core")
      framework_b = create(:standard_framework, tenant: tenant, name: "NGSS")
      standard_a = create(:standard, tenant: tenant, standard_framework: framework_a, code: "CC.1")
      create(:standard, tenant: tenant, standard_framework: framework_b, code: "NGSS.1")
      Current.tenant = nil

      get "/api/v1/addon/standards", params: { framework_id: framework_a.id }, headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["id"]).to eq(standard_a.id)
      expect(response.parsed_body.first["framework_name"]).to eq("Common Core")
    end
  end

  describe "GET /api/v1/addon/templates" do
    it "returns published templates only" do
      Current.tenant = tenant
      create(:template, tenant: tenant, created_by: admin, name: "Published", status: "published")
      create(:template, tenant: tenant, created_by: admin, name: "Draft", status: "draft")
      Current.tenant = nil

      get "/api/v1/addon/templates", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
      expect(response.parsed_body.first["name"]).to eq("Published")
    end
  end

  describe "POST /api/v1/addon/ai_generate" do
    it "validates task_type policy and proxies to AI gateway" do
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin, provider_name: "fake", default_model: "fake-model")
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "teacher" ]
      )
      Current.tenant = nil

      fake_response = instance_double(Faraday::Response, status: 200, body: {
        "content" => "{\"title\":\"Fractions\"}",
        "provider" => "fake",
        "model" => "fake-model",
        "usage" => { "prompt_tokens" => 12, "completion_tokens" => 10, "total_tokens" => 22 }
      }, success?: true)
      allow_any_instance_of(Faraday::Connection).to receive(:post).and_return(fake_response)

      expect {
        post "/api/v1/addon/ai_generate",
          params: { task_type: "lesson_plan", prompt: "Generate a lesson", context: { grade: "5" } },
          headers: auth_headers
      }.to change(AiInvocation.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["content"]).to include("Fractions")
      expect(AiInvocation.unscoped.order(:id).last.status).to eq("completed")
    end
  end

  describe "POST /api/v1/addon/attach" do
    it "attaches a drive link to a lesson" do
      Current.tenant = tenant
      academic_year = create(:academic_year, tenant: tenant)
      course = create(:course, tenant: tenant, academic_year: academic_year)
      unit_plan = create(:unit_plan, tenant: tenant, course: course, created_by: teacher)
      lesson = create(:lesson_plan, tenant: tenant, unit_plan: unit_plan, created_by: teacher)
      version = lesson.create_version!(title: "Lesson v1")
      Current.tenant = nil

      expect {
        post "/api/v1/addon/attach",
          params: {
            linkable_type: "LessonVersion",
            linkable_id: version.id,
            drive_file_url: "https://docs.google.com/document/d/abc123",
            drive_file_title: "Lesson Notes",
            drive_file_id: "abc123",
            drive_mime_type: "application/vnd.google-apps.document"
          },
          headers: auth_headers
      }.to change(ResourceLink.unscoped, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["drive_file_id"]).to eq("abc123")
    end
  end

  describe "authentication" do
    it "returns 401 without a valid addon token" do
      get "/api/v1/addon/unit_plans"
      expect(response).to have_http_status(:unauthorized)

      get "/api/v1/addon/standards", headers: { "Authorization" => "Bearer wrong-token" }
      expect(response).to have_http_status(:unauthorized)

      get "/api/v1/addon/templates"
      expect(response).to have_http_status(:unauthorized)

      post "/api/v1/addon/ai_generate", params: { task_type: "lesson_plan", prompt: "x" }
      expect(response).to have_http_status(:unauthorized)

      post "/api/v1/addon/attach", params: { linkable_type: "LessonVersion", linkable_id: 1 }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
