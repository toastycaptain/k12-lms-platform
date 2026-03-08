require "rails_helper"

RSpec.describe Curriculum::WorkflowTemplateLibrary do
  before do
    CurriculumProfileRegistry.reset!
  end

  it "builds a reusable workflow catalog from the IB pack" do
    pack = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2")

    catalog = described_class.catalog(pack: pack)

    expect(catalog).not_to be_empty
    expect(catalog.map { |row| row[:template_scope] }).to include("shared_default", "pack_specific")
  end

  it "resolves workflow bindings without changing the WorkflowRegistry contract" do
    pack = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2")

    resolved = described_class.resolve(pack: pack, document_type: "unit_plan")

    expect(resolved[:key]).to be_present
    expect(resolved[:definition]).to be_present
    expect(resolved[:template_scope]).to eq("shared_default")
  end
end
