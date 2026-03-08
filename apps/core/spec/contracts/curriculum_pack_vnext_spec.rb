require "rails_helper"

RSpec.describe "Curriculum pack vnext capability contract" do
  let(:schema_path) { Rails.root.join("..", "..", "packages", "contracts", "curriculum-pack-vnext.schema.json") }
  let(:schemer) { JSONSchemer.schema(JSON.parse(schema_path.read)) }

  before do
    CurriculumProfileRegistry.reset!
  end

  it "validates normalized capability contracts for current system packs" do
    profiles = [
      CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2"),
      CurriculumProfileRegistry.find("american_common_core_v1"),
      CurriculumProfileRegistry.find("british_cambridge_v1")
    ]

    profiles.each do |profile|
      expect(profile).to be_present

      normalized = Curriculum::PackCapabilitySchema.normalize(pack: profile)
      errors = schemer.validate(normalized).to_a

      expect(errors).to be_empty, "Expected #{normalized.dig(:pack, :key)} to satisfy vnext schema: #{errors.inspect}"
    end
  end
end
