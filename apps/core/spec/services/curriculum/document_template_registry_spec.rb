require "rails_helper"

RSpec.describe Curriculum::DocumentTemplateRegistry do
  before do
    CurriculumProfileRegistry.reset!
  end

  it "builds reusable template catalogs across supported packs" do
    packs = [
      CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2"),
      CurriculumProfileRegistry.find("american_common_core_v1"),
      CurriculumProfileRegistry.find("british_cambridge_v1")
    ]

    packs.each do |pack|
      catalog = described_class.catalog(pack: pack)

      expect(catalog).not_to be_empty
      expect(catalog.first).to include(:key, :label, :allowed_schema_keys, :inherited_from)
    end
  end

  it "marks inherited template families without hardcoding pack-specific behavior into consumers" do
    pack = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2")

    unit_template = described_class.template_for(pack: pack, document_type: "unit_plan")
    pyp_template = described_class.template_for(pack: pack, document_type: "ib_pyp_unit")

    expect(unit_template[:inherited_from]).to eq("core_planner_document")
    expect(pyp_template[:inherited_from]).to eq("ib_pyp_base")
  end
end
