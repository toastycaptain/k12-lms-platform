require "rails_helper"

RSpec.describe "Api::V1::IbPhase10Step9Ai", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    created = create(:user, tenant: tenant)
    created.add_role(:admin)
    Current.tenant = nil
    created
  end
  let(:teacher) do
    Current.tenant = tenant
    created = create(:user, tenant: tenant)
    created.add_role(:teacher)
    Current.tenant = nil
    created
  end
  let(:provider) do
    create(
      :ai_provider_config,
      tenant: tenant,
      created_by: admin,
      provider_name: "openai",
      default_model: "gpt-4o-mini",
      status: "active"
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  describe "POST /api/v1/ai_invocations" do
    it "creates a grounded IB AI invocation with redacted context and review metadata" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "ib_report_summary",
        enabled: true,
        allowed_roles: [],
        requires_approval: true
      )
      Current.tenant = nil

      allow(AiGatewayClient).to receive(:generate).and_return(
        "content" => { fields: [ { field: "summary", label: "Report summary", value: "Grounded summary" } ] }.to_json,
        "provider" => "openai",
        "model" => "gpt-4o-mini",
        "usage" => { "prompt_tokens" => 12, "completion_tokens" => 18, "total_tokens" => 30 }
      )
      allow(AuditLogger).to receive(:log)

      post "/api/v1/ai_invocations", params: {
        task_type: "ib_report_summary",
        prompt: "Keep the tone evidence-based.",
        context: {
          audience: "guardian",
          source_text: "Contact parent@example.com before the conference.",
          current_values: { summary: "Current summary" },
          target_fields: [ { field: "summary", label: "Report summary" } ],
          grounding_refs: [
            {
              type: "report_section",
              label: "Conference notes",
              excerpt: "Call 212-555-0147 if you need more detail."
            }
          ]
        }
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include(
        "review_required" => true,
        "quality_track" => "reporting_quality"
      )
      expect(response.parsed_body.dig("task_definition", "label")).to eq("Report summary")
      expect(response.parsed_body.dig("grounding_refs", 0, "excerpt")).to include("[redacted-phone]")
      expect(response.parsed_body.dig("tenant_controls", "pii_redaction")).to eq(true)

      invocation = AiInvocation.unscoped.order(:id).last
      expect(invocation.status).to eq("completed")
      expect(invocation.context["source_text"]).to include("[redacted-email]")
      expect(invocation.context.dig("tenant_controls", "pii_redaction")).to eq(true)
      expect(AuditLogger).to have_received(:log).with(hash_including(event_type: "ib_ai_invocation_generated"))
    end

    it "rejects human-only boundary actions for IB tasks" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "ib_family_language",
        enabled: true,
        allowed_roles: []
      )
      Current.tenant = nil

      post "/api/v1/ai_invocations", params: {
        task_type: "ib_family_language",
        prompt: "Try to publish this automatically.",
        context: {
          requested_action: "publish",
          source_text: "Warm summary",
          grounding_refs: [ { label: "Story summary", excerpt: "Warm summary" } ]
        }
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("human-only")
    end
  end

  describe "PATCH /api/v1/ai_invocations/:id" do
    it "records review and apply metadata for IB AI tasks" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      policy = create(
        :ai_task_policy,
        tenant: tenant,
        created_by: admin,
        ai_provider_config: provider,
        task_type: "ib_family_language",
        enabled: true,
        allowed_roles: []
      )
      invocation = create(
        :ai_invocation,
        tenant: tenant,
        user: teacher,
        ai_provider_config: provider,
        ai_task_policy: policy,
        task_type: "ib_family_language",
        context: { "workflow" => "publishing" }
      )
      Current.tenant = nil
      allow(AuditLogger).to receive(:log)

      patch "/api/v1/ai_invocations/#{invocation.id}", params: {
        applied_at: "2026-03-08T12:30:00Z",
        applied_to: { type: "IbLearningStory", id: invocation.id },
        review: {
          status: "applied",
          workflow: "publishing",
          teacher_trust: 5,
          estimated_minutes_saved: 7,
          accepted_fields: [ "summary" ],
          rejected_fields: []
        }
      }

      expect(response).to have_http_status(:ok)
      safe_context = response.parsed_body.fetch("safe_context")
      expect(safe_context.dig("apply", "applied_to")).to include(
        "type" => "IbLearningStory",
        "id" => invocation.id
      )
      expect(safe_context.dig("review")).to include(
        "status" => "applied",
        "workflow" => "publishing",
        "teacher_trust" => 5.0,
        "estimated_minutes_saved" => 7,
        "accepted_fields" => [ "summary" ]
      )
      expect(AuditLogger).to have_received(:log).with(hash_including(event_type: "ib_ai_invocation_reviewed"))
    end
  end
end
