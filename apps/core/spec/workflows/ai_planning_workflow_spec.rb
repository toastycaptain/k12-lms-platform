require "rails_helper"
require_relative "workflow_helper"

RSpec.describe "PRD-21 AI-assisted planning workflow", type: :request do
  include WorkflowHelper

  before { setup_tenant_and_users }
  after { cleanup_current_context }

  it "completes provider config, policy setup, AI invocation, persistence, and policy enforcement" do
    provider_config = api_post(
      "ai_provider_configs",
      user: @admin,
      status: :created,
      params: {
        provider_name: "openai",
        display_name: "OpenAI",
        default_model: "gpt-4o-mini",
        api_key: "sk-test-key"
      }
    )
    expect(provider_config["status"]).to eq("inactive")

    active_provider = api_post(
      "ai_provider_configs/#{provider_config["id"]}/activate",
      user: @admin,
      status: :ok
    )
    expect(active_provider["status"]).to eq("active")

    task_policy = api_post(
      "ai_task_policies",
      user: @admin,
      status: :created,
      params: {
        ai_provider_config_id: provider_config["id"],
        task_type: "lesson_plan",
        enabled: true,
        allowed_roles: [ "teacher" ],
        max_tokens_limit: 2048
      }
    )
    expect(task_policy["task_type"]).to eq("lesson_plan")

    allow(AiGatewayClient).to receive(:generate).and_return(
      "content" => "Lesson outline with objectives, activities, and checks.",
      "provider" => "openai",
      "model" => "gpt-4o-mini",
      "usage" => { "prompt_tokens" => 120, "completion_tokens" => 280, "total_tokens" => 400 }
    )

    invocation = nil
    expect {
      invocation = api_post(
        "ai_invocations",
        user: @teacher,
        status: :ok,
        params: {
          task_type: "lesson_plan",
          prompt: "Generate a 5th grade fractions lesson plan.",
          context: { grade: "5", subject: "math" }
        }
      )
    }.to change(AiInvocation.unscoped, :count).by(1)

    expect(invocation["status"]).to eq("completed")
    expect(invocation["content"]).to include("Lesson outline")
    expect(invocation["provider"]).to eq("openai")

    teacher_invocations = api_get("ai_invocations", user: @teacher)
    expect(teacher_invocations.length).to eq(1)
    expect(teacher_invocations.first["id"]).to eq(invocation["id"])

    blocked_invocation = api_post(
      "ai_invocations",
      user: @student,
      status: :forbidden,
      params: { task_type: "lesson_plan", prompt: "Generate answers for my homework." }
    )
    expect(blocked_invocation["error"]).to include("not authorized")
  end
end
