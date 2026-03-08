require "rails_helper"

RSpec.describe Ib::Ai::GuardrailService do
  let(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    created = create(:user, tenant: tenant)
    created.add_role(:teacher)
    Current.tenant = nil
    created
  end
  let(:definition) { Ib::Ai::TaskCatalog.fetch!("ib_report_summary") }

  subject(:service) { described_class.new(user: user, task_definition: definition) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "redacts pii and constrains visible grounding data" do
    sanitized = service.sanitize(
      "source_text" => "Contact parent@example.com or 415-555-1212 for student 12345678.",
      "grounding_refs" => [
        {
          "type" => "report_section",
          "label" => "Family note",
          "excerpt" => "Reach us at family@example.com or 212-555-9999."
        }
      ],
      "target_fields" => [
        { "field" => "summary", "label" => "Report summary" }
      ],
      "current_values" => {
        "summary" => "Current summary"
      },
      "student_name" => "Hidden"
    )

    expect(sanitized["source_text"]).to include("[redacted-email]")
    expect(sanitized["source_text"]).to include("[redacted-phone]")
    expect(sanitized["source_text"]).to include("[redacted-id]")
    expect(sanitized["grounding_refs"].first["excerpt"]).to include("[redacted-email]")
    expect(sanitized["grounding_refs"].first["excerpt"]).to include("[redacted-phone]")
    expect(sanitized).not_to have_key("student_name")
  end

  it "blocks human-only actions and ungrounded requests" do
    expect {
      service.sanitize("requested_action" => "release", "source_text" => "Allowed source")
    }.to raise_error(Ib::Ai::GuardrailService::GuardrailViolation, /human-only/i)

    expect {
      service.sanitize("requested_tone" => "warm")
    }.to raise_error(Ib::Ai::GuardrailService::GuardrailViolation, /Grounded source text is required/)
  end
end
