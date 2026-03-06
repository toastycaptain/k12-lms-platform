require "rails_helper"

RSpec.describe Curriculum::DocumentContentService do
  let(:tenant) { create(:tenant) }
  let(:schema_resolution) do
    {
      schema_key: "ib.unit@v1",
      data_schema: {
        "type" => "object",
        "required" => [ "title" ],
        "properties" => {
          "title" => { "type" => "string" }
        },
        "additionalProperties" => false
      }
    }
  end

  before do
    allow(Curriculum::PackSchemaResolver).to receive(:resolve_schema!).and_return(schema_resolution)
  end

  describe ".validate_content!" do
    it "validates content against schema when enforcement is enabled" do
      expect(
        described_class.validate_content!(
          tenant: tenant,
          pack_key: "ib_continuum_v1",
          pack_version: "2026.1",
          document_type: "unit_plan",
          schema_key: "ib.unit@v1",
          content: { "title" => "Unit 1" },
          enforce_validation: true
        )
      ).to eq(true)
    end

    it "rejects oversized payloads" do
      content = { "body" => "a" * (described_class::MAX_JSON_BYTES + 10) }

      expect {
        described_class.validate_content!(
          tenant: tenant,
          pack_key: "ib_continuum_v1",
          pack_version: "2026.1",
          document_type: "unit_plan",
          schema_key: "ib.unit@v1",
          content: content,
          enforce_validation: true
        )
      }.to raise_error(ArgumentError, /content too large/)
    end

    it "skips schema enforcement when disabled" do
      expect(
        described_class.validate_content!(
          tenant: tenant,
          pack_key: "ib_continuum_v1",
          pack_version: "2026.1",
          document_type: "unit_plan",
          schema_key: "ib.unit@v1",
          content: { "unexpected" => true },
          enforce_validation: false
        )
      ).to eq(true)
      expect(Curriculum::PackSchemaResolver).not_to have_received(:resolve_schema!)
    end
  end
end
