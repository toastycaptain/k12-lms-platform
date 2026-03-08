require "rails_helper"

RSpec.describe Ib::Ai::Orchestrator do
  let(:tenant) { create(:tenant, settings: { "ib_ai_assist" => { "allow_guardian_translation" => true } }) }
  let(:user) do
    Current.tenant = tenant
    created = create(:user, tenant: tenant)
    created.add_role(:teacher)
    Current.tenant = nil
    created
  end

  subject(:orchestrator) { described_class.new(user: user) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "builds grounded messages and review-first context for IB tasks" do
    prepared = orchestrator.prepare(
      task_type: "ib_family_language",
      prompt: "Keep the tone family-facing.",
      context: {
        workflow: "publishing",
        locale: "es",
        source_text: "Students explained how water systems affect communities.",
        grounding_refs: [
          {
            type: "story_summary",
            label: "Story summary",
            excerpt: "Students explained how water systems affect communities."
          }
        ],
        current_values: {
          summary: "Current summary"
        },
        target_fields: [
          { field: "summary", label: "Story summary" }
        ]
      }
    )

    expect(prepared[:definition][:label]).to eq("Family language polish")
    expect(prepared[:messages].first[:content]).to include("human-only boundaries")
    expect(prepared[:messages].last[:content]).to include("Teacher instruction")
    expect(prepared[:context]["workflow"]).to eq("publishing")
    expect(prepared[:context]["review_required"]).to eq(true)
    expect(prepared[:context]["tenant_controls"]["allow_guardian_translation"]).to eq(true)
    expect(prepared[:context]["guardrail_flags"]).to include(
      "pii_redaction" => true,
      "grounding_required" => true
    )
  end
end
