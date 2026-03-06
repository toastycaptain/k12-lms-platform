require "rails_helper"

RSpec.describe Ib::Governance::RolloutConsoleService do
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

  it "surfaces pack drift, route drift, and missing route hints" do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )
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
    create(:ib_operational_record, tenant: tenant, school: school, planning_context: planning_context, route_hint: nil)
    FeatureFlag.create!(key: "curriculum_documents_v1", enabled: true, tenant: tenant)

    payload = described_class.new(tenant: tenant, school: school).build

    expect(payload[:active_pack][:key]).to eq("ib_continuum_v1")
    expect(payload[:active_pack][:deprecated_record_count]).to eq(1)
    expect(payload[:migration_drift][:missing_schema_key]).to eq(1)
    expect(payload[:migration_drift][:missing_route_hint_records]).to eq(1)
    expect(payload[:legacy_usage][:legacy_document_routes]).to eq(1)
    expect(payload[:feature_flags][:required].detect { |row| row[:key] == "curriculum_documents_v1" }[:enabled]).to eq(true)
  end
end
