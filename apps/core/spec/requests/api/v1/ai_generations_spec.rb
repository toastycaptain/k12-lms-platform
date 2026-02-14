require "rails_helper"

RSpec.describe "Api::V1::Ai::AiGenerations", type: :request do
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
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  let!(:provider_config) do
    Current.tenant = tenant
    config = create(:ai_provider_config, tenant: tenant, created_by: admin, status: "active")
    Current.tenant = nil
    config
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/ai/generate_unit" do
    let!(:task_policy) do
      Current.tenant = tenant
      tp = create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider_config,
        created_by: admin,
        task_type: "unit_generation",
        allowed_roles: [ "admin", "teacher" ],
        enabled: true
      )
      Current.tenant = nil
      tp
    end

    it "returns 202 and invocation_id for teacher with enabled task policy" do
      mock_session(teacher, tenant: tenant)
      allow(AiUnitGenerationJob).to receive(:perform_later)

      post "/api/v1/ai/generate_unit", params: {
        subject: "Math",
        topic: "Fractions",
        grade_level: "5"
      }

      expect(response).to have_http_status(:accepted)
      body = response.parsed_body
      expect(body["invocation_id"]).to be_present
      expect(body["status"]).to eq("pending")
      expect(AiUnitGenerationJob).to have_received(:perform_later).with(
        body["invocation_id"],
        hash_including("subject" => "Math", "topic" => "Fractions", "grade_level" => "5")
      )
    end

    it "returns 403 for student without allowed role" do
      mock_session(student, tenant: tenant)

      post "/api/v1/ai/generate_unit", params: {
        subject: "Math",
        topic: "Fractions",
        grade_level: "5"
      }

      expect(response).to have_http_status(:forbidden)
    end

    it "returns 403 when task policy is disabled" do
      Current.tenant = tenant
      task_policy.update!(enabled: false)
      Current.tenant = nil

      mock_session(teacher, tenant: tenant)

      post "/api/v1/ai/generate_unit", params: {
        subject: "Math",
        topic: "Fractions",
        grade_level: "5"
      }

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["error"]).to eq("AI task not available")
    end

    it "creates an AiInvocation record" do
      mock_session(teacher, tenant: tenant)
      allow(AiUnitGenerationJob).to receive(:perform_later)

      expect {
        post "/api/v1/ai/generate_unit", params: {
          subject: "Math",
          topic: "Fractions",
          grade_level: "5"
        }
      }.to change(AiInvocation.unscoped, :count).by(1)

      invocation = AiInvocation.unscoped.last
      expect(invocation.task_type).to eq("unit_generation")
      expect(invocation.status).to eq("pending")
      expect(invocation.user_id).to eq(teacher.id)
    end
  end

  describe "POST /api/v1/ai/generate_lesson" do
    let!(:task_policy) do
      Current.tenant = tenant
      tp = create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider_config,
        created_by: admin,
        task_type: "lesson_generation",
        allowed_roles: [ "admin", "teacher" ],
        enabled: true
      )
      Current.tenant = nil
      tp
    end

    it "returns 202 and invocation_id for teacher" do
      mock_session(teacher, tenant: tenant)
      allow(AiLessonGenerationJob).to receive(:perform_later)

      post "/api/v1/ai/generate_lesson", params: {
        subject: "Science",
        topic: "Photosynthesis",
        grade_level: "7"
      }

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["invocation_id"]).to be_present
    end
  end

  describe "POST /api/v1/ai/differentiate" do
    let!(:task_policy) do
      Current.tenant = tenant
      tp = create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider_config,
        created_by: admin,
        task_type: "differentiation",
        allowed_roles: [ "admin", "teacher" ],
        enabled: true
      )
      Current.tenant = nil
      tp
    end

    it "returns 202 and invocation_id" do
      mock_session(teacher, tenant: tenant)
      allow(AiDifferentiationJob).to receive(:perform_later)

      post "/api/v1/ai/differentiate", params: {
        content: "Original lesson content",
        differentiation_type: "advanced",
        grade_level: "5"
      }

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["invocation_id"]).to be_present
    end
  end

  describe "POST /api/v1/ai/generate_assessment" do
    let!(:task_policy) do
      Current.tenant = tenant
      tp = create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider_config,
        created_by: admin,
        task_type: "assessment_generation",
        allowed_roles: [ "admin", "teacher" ],
        enabled: true
      )
      Current.tenant = nil
      tp
    end

    it "returns 202 and invocation_id" do
      mock_session(teacher, tenant: tenant)
      allow(AiAssessmentGenerationJob).to receive(:perform_later)

      post "/api/v1/ai/generate_assessment", params: {
        topic: "World War II",
        grade_level: "10",
        num_questions: 10,
        question_types: [ "multiple_choice", "short_answer" ]
      }

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["invocation_id"]).to be_present
    end
  end

  describe "POST /api/v1/ai/rewrite" do
    let!(:task_policy) do
      Current.tenant = tenant
      tp = create(:ai_task_policy,
        tenant: tenant,
        ai_provider_config: provider_config,
        created_by: admin,
        task_type: "rewrite",
        allowed_roles: [ "admin", "teacher" ],
        enabled: true
      )
      Current.tenant = nil
      tp
    end

    it "returns 202 and invocation_id" do
      mock_session(teacher, tenant: tenant)
      allow(AiRewriteJob).to receive(:perform_later)

      post "/api/v1/ai/rewrite", params: {
        content: "Complex academic text here",
        instruction: "Simplify for younger readers",
        grade_level: "3"
      }

      expect(response).to have_http_status(:accepted)
      expect(response.parsed_body["invocation_id"]).to be_present
    end
  end

  describe "GET /api/v1/ai/invocations/:id/result" do
    let(:memory_store) { ActiveSupport::Cache::MemoryStore.new }

    before do
      allow(Rails).to receive(:cache).and_return(memory_store)
    end

    it "returns invocation status and cached content" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      invocation = create(:ai_invocation,
        tenant: tenant,
        user: teacher,
        ai_provider_config: provider_config,
        task_type: "unit_generation",
        status: "completed"
      )
      memory_store.write("ai_result_#{invocation.id}", { "title" => "Unit Plan" })
      Current.tenant = nil

      get "/api/v1/ai/invocations/#{invocation.id}/result"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("completed")
      expect(body["content"]["title"]).to eq("Unit Plan")
    end

    it "returns status with nil content when not cached" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      invocation = create(:ai_invocation,
        tenant: tenant,
        user: teacher,
        ai_provider_config: provider_config,
        task_type: "unit_generation",
        status: "pending"
      )
      Current.tenant = nil

      get "/api/v1/ai/invocations/#{invocation.id}/result"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("pending")
      expect(body["content"]).to be_nil
    end

    it "returns error_message for failed invocations" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      invocation = create(:ai_invocation,
        tenant: tenant,
        user: teacher,
        ai_provider_config: provider_config,
        task_type: "unit_generation",
        status: "failed",
        error_message: "Gateway timeout"
      )
      Current.tenant = nil

      get "/api/v1/ai/invocations/#{invocation.id}/result"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["status"]).to eq("failed")
      expect(body["error_message"]).to eq("Gateway timeout")
    end
  end
end
