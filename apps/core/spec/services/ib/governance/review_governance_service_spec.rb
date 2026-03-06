require "rails_helper"

RSpec.describe Ib::Governance::ReviewGovernanceService do
  let(:tenant) { create(:tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:other_school) { create(:school, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, created_by: admin) }
  let(:other_context) { create(:planning_context, tenant: tenant, school: other_school, created_by: admin) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "scopes approvals and governance queues to the requested school" do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2",
      status: "pending_approval"
    )
    document.update_column(:updated_at, 7.days.ago)

    other_document = create(
      :curriculum_document,
      tenant: tenant,
      school: other_school,
      planning_context: other_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )

    create(:approval, tenant: tenant, approvable: document, requested_by: admin)
    create(:approval, tenant: tenant, approvable: other_document, requested_by: admin)
    create(:ib_operational_record, tenant: tenant, school: school, planning_context: planning_context, owner: nil, student: nil, created_at: 2.days.ago, updated_at: 1.day.ago, record_family: "myp_project", programme: "MYP")

    payload = described_class.new(tenant: tenant, school: school).build

    expect(payload[:summary_metrics][:approvals]).to eq(1)
    expect(payload[:summary_metrics][:orphaned]).to eq(1)
    expect(payload[:summary_metrics][:sla_breaches]).to eq(1)
    expect(payload[:queues][:approvals].first[:href]).to eq("/ib/pyp/units/#{document.id}")
  end
end
