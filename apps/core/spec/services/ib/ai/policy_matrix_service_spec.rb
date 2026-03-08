require "rails_helper"

RSpec.describe Ib::Ai::PolicyMatrixService do
  let(:tenant) { create(:tenant, settings: { "ib_ai_assist" => { "pii_redaction" => false } }) }
  let(:user) do
    Current.tenant = tenant
    created = create(:user, tenant: tenant)
    created.add_role(:teacher)
    Current.tenant = nil
    created
  end
  let(:provider) do
    create(:ai_provider_config, tenant: tenant, created_by: user, status: "active")
  end
  let!(:policy) do
    create(
      :ai_task_policy,
      tenant: tenant,
      created_by: user,
      ai_provider_config: provider,
      task_type: "ib_report_summary",
      allowed_roles: [],
      enabled: true
    )
  end

  subject(:service) { described_class.new(user: user) }

  before do
    create(
      :ai_invocation,
      tenant: tenant,
      user: user,
      ai_provider_config: provider,
      ai_task_policy: policy,
      task_type: "ib_report_summary",
      context: {
        "review" => {
          "teacher_trust" => 4,
          "estimated_minutes_saved" => 9
        },
        "apply" => {
          "applied_at" => Time.current.utc.iso8601
        }
      }
    )
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "surfaces task availability, trust, and tenant control overrides" do
    matrix = service.build
    report_task = matrix[:tasks].find { |task| task[:task_type] == "ib_report_summary" }

    expect(matrix[:provider_ready]).to eq(true)
    expect(matrix[:available_count]).to be >= 1
    expect(matrix[:estimated_minutes_saved]).to eq(9)
    expect(matrix[:tenant_controls]["pii_redaction"]).to eq(false)
    expect(matrix[:benchmarks]).not_to be_empty
    expect(matrix[:red_team_scenarios]).not_to be_empty
    expect(report_task).to include(
      available: true,
      review_required: true,
      invocation_count: 1,
      applied_count: 1,
      average_trust: 4.0
    )
  end
end
