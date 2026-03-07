require "rails_helper"

RSpec.describe Ib::Migration::ImportBatchService do
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
  let(:actor) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:planning_context) { create(:planning_context, tenant: tenant, school: school, academic_year: academic_year, created_by: actor, name: "Grade 5 PYP") }

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "updates matching curriculum documents instead of duplicating them" do
    document = create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: actor,
      title: "Imported PYP Unit",
      document_type: "ib_pyp_unit",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )
    document.create_version!(
      title: document.title,
      content: { "overview" => "Before import" },
      created_by: actor,
    )

    service = described_class.new(tenant: tenant, school: school, actor: actor)
    batch = service.create!(
      source_kind: "curriculum_document",
      source_format: "csv",
      source_filename: "pyp-units.csv",
      raw_payload: "planning_context_name,title,document_type,schema_key,content_json\nGrade 5 PYP,Imported PYP Unit,ib_pyp_unit,ib.pyp.unit@v2,{\"overview\":\"After import\"}",
      academic_year: academic_year,
      programme: "PYP",
      mapping_payload: {
        planning_context_name: planning_context.name,
        document_type: "ib_pyp_unit",
        schema_key: "ib.pyp.unit@v2"
      }
    )

    service.dry_run!(batch: batch)
    summary = service.execute!(batch: batch)

    expect(summary["updated_count"]).to eq(1)
    expect(CurriculumDocument.where(tenant: tenant, school: school, title: "Imported PYP Unit").count).to eq(1)
    expect(document.reload.versions.count).to eq(2)
    expect(document.current_version.content).to include("overview" => "After import")
  end
end
