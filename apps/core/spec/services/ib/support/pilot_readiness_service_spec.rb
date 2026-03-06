require "rails_helper"

RSpec.describe Ib::Support::PilotReadinessService do
  let(:tenant) do
    create(
      :tenant,
      settings: {
        "curriculum_default_profile_key" => "ib_continuum_v1",
        "curriculum_default_profile_version" => "2026.2"
      }
    )
  end
  let(:school) { create(:school, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, created_by: admin) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "reports migration and telemetry sections alongside governance readiness" do
    cycle = create(:ib_standards_cycle, tenant: tenant, school: school)
    packet = create(:ib_standards_packet, tenant: tenant, school: school, ib_standards_cycle: cycle, owner: admin)
    create(:ib_standards_export, tenant: tenant, school: school, ib_standards_cycle: cycle, ib_standards_packet: packet, initiated_by: admin, status: "failed")
    create(:ib_publishing_queue_item, tenant: tenant, school: school, created_by: admin, state: "held")
    create(:ib_publishing_audit, tenant: tenant, school: school, changed_by: admin, event_type: "publish_failed")
    legacy_document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_unknown_document",
      pack_key: "ib_continuum_v1",
      pack_version: "2025.4",
      schema_key: "ib.unknown@v2"
    )
    CurriculumDocument.where(id: legacy_document.id).update_all(schema_key: "")

    payload = described_class.new(tenant: tenant, school: school).build
    keys = payload[:sections].map { |section| section[:key] }

    expect(payload[:overall_status]).to eq("yellow")
    expect(keys).to include("document_migration", "telemetry_signals", "publishing_reliability")
    expect(payload[:sections].find { |section| section[:key] == "telemetry_signals" }[:issues]).not_to be_empty
  end
end
