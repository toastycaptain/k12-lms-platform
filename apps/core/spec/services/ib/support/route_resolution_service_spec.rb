require "rails_helper"

RSpec.describe Ib::Support::RouteResolutionService do
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

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "resolves entity refs to canonical IB routes" do
    evidence = create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)

    resolution = described_class.new(user: admin, tenant: tenant, school: school).resolve(entity_ref: "IbEvidenceItem:#{evidence.id}")

    expect(resolution[:status]).to eq("ok")
    expect(resolution[:route_id]).to eq("ib.evidence.item")
    expect(resolution[:href]).to eq("/ib/evidence/items/#{evidence.id}")
    expect(resolution[:fallback_route_id]).to eq("ib.evidence")
  end

  it "returns school mismatch when the resolved record belongs to another school" do
    evidence = create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)

    resolution = described_class.new(user: admin, tenant: tenant, school: other_school).resolve(entity_ref: "IbEvidenceItem:#{evidence.id}")

    expect(resolution[:status]).to eq("school_mismatch")
    expect(resolution[:href]).to eq("/ib/evidence/items/#{evidence.id}")
    expect(resolution[:fallback_href]).to eq("/ib/evidence")
  end

  it "redirects legacy plan document paths to canonical IB document routes" do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_myp_unit",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.myp.unit@v2"
    )

    resolution = described_class.new(user: admin, tenant: tenant, school: school).resolve(href: "/plan/documents/#{document.id}")

    expect(resolution[:status]).to eq("deprecated_redirect")
    expect(resolution[:route_id]).to eq("ib.myp.unit")
    expect(resolution[:redirect_to]).to eq("/ib/myp/units/#{document.id}")
  end

  it "normalizes demo links to the IB home route" do
    resolution = described_class.new(user: admin, tenant: tenant, school: school).resolve(href: "/ib/demo")

    expect(resolution[:status]).to eq("deprecated_redirect")
    expect(resolution[:route_id]).to eq("ib.home")
    expect(resolution[:redirect_to]).to eq("/ib/home")
  end
end
