require "rails_helper"

RSpec.describe Curriculum::PackCapabilitySchema do
  let(:tenant) { create(:tenant) }

  before do
    CurriculumProfileRegistry.reset!
  end

  it "normalizes the IB pack into a shared capability schema" do
    pack = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2")

    schema = described_class.normalize(pack: pack)

    expect(schema[:schema_version]).to eq("curriculum_pack_vnext.v1")
    expect(schema.dig(:pack, :key)).to eq("ib_continuum_v1")
    expect(schema.dig(:capabilities, :documents, :template_catalog)).not_to be_empty
    expect(schema.dig(:capabilities, :workflows, :templates)).not_to be_empty
    expect(schema.dig(:capabilities, :reporting, :engine_key)).to eq("curriculum_reporting_v1")
    expect(schema.dig(:capabilities, :migration, :connectors)).to include("generic", "toddle", "managebac")
    expect(schema.dig(:capabilities, :governance, :consoles).map { |row| row[:key] }).to include("rollout", "readiness")
  end

  it "is attached to pack store metadata for runtime consumers" do
    payload = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.2")
    CurriculumProfileRelease.create!(
      tenant: tenant,
      profile_key: "ib_continuum_v1",
      profile_version: "2026.2",
      status: "published",
      payload: payload,
      metadata: {}
    )
    CurriculumPackStore.invalidate_cache!(tenant: tenant)

    fetched = CurriculumPackStore.fetch(
      tenant: tenant,
      key: "ib_continuum_v1",
      version: "2026.2",
      with_metadata: true
    )

    expect(fetched[:capability_schema]).to be_present
    expect(fetched[:primitive_inventory]).to be_present
    expect(fetched.dig(:capability_schema, :pack, :key)).to eq("ib_continuum_v1")
  end
end
