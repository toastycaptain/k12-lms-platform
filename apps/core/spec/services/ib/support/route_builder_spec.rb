require "rails_helper"

RSpec.describe Ib::Support::RouteBuilder do
  let(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: admin) }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "routes DP course-map documents to the canonical phase 4 path" do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_dp_course_map",
      schema_key: "ib.dp.course_map@v2"
    )

    expect(described_class.href_for(document)).to eq("/ib/dp/course-maps/#{document.id}")
  end

  it "routes phase 4 operational records to their canonical detail pages" do
    project = create(:ib_operational_record, tenant: tenant, school: school, planning_context: planning_context, programme: "MYP", record_family: "myp_project", subtype: "personal_project")
    cas = create(:ib_operational_record, tenant: tenant, school: school, planning_context: planning_context, programme: "DP", record_family: "dp_cas", subtype: "cas_experience")

    expect(described_class.href_for(project)).to eq("/ib/myp/projects/#{project.id}")
    expect(described_class.href_for(cas)).to eq("/ib/dp/cas/records/#{cas.id}")
  end

  it "routes evidence, stories, publishing queue items, and standards packets to canonical phase 5 pages" do
    evidence = create(:ib_evidence_item, tenant: tenant, school: school, planning_context: planning_context)
    story = create(:ib_learning_story, tenant: tenant, school: school, planning_context: planning_context, created_by: admin)
    queue_item = create(:ib_publishing_queue_item, tenant: tenant, school: school, ib_learning_story: story, created_by: admin)
    cycle = create(:ib_standards_cycle, tenant: tenant, school: school, academic_year: academic_year, coordinator: admin)
    packet = create(:ib_standards_packet, tenant: tenant, school: school, ib_standards_cycle: cycle, owner: admin)

    expect(described_class.href_for(evidence)).to eq("/ib/evidence/items/#{evidence.id}")
    expect(described_class.href_for(story)).to eq("/ib/families/stories/#{story.id}")
    expect(described_class.href_for(queue_item)).to eq("/ib/families/publishing/#{queue_item.id}")
    expect(described_class.href_for(packet)).to eq("/ib/standards-practices/packets/#{packet.id}")
    expect(described_class.fallback_route_id_for(packet)).to eq("ib.standards-practices")
  end

  it "keeps unknown document types visible as legacy fallback routes" do
    legacy_document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_unknown_document",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.unknown@v2"
    )

    route = described_class.route_for(legacy_document)

    expect(route[:route_id]).to eq("ib.home")
    expect(route[:href]).to eq("/plan/documents/#{legacy_document.id}")
    expect(route[:fallback_route_id]).to eq("ib.home")
  end
end
