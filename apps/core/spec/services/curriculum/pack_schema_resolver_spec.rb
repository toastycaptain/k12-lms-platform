require "rails_helper"

RSpec.describe Curriculum::PackSchemaResolver do
  let(:tenant) { create(:tenant) }
  let(:pack_payload) do
    {
      "identity" => { "key" => "ib_continuum_v1" },
      "versioning" => { "version" => "2026.1" },
      "document_types" => {
        "unit_plan" => {
          "allowed_schema_keys" => [ "ib.unit@v1" ],
          "default_schema_key" => "ib.unit@v1"
        },
        "lesson_plan" => {
          "allowed_schema_keys" => [ "ib.lesson@v1" ],
          "default_schema_key" => "ib.lesson@v1"
        }
      },
      "document_schemas" => {
        "ib.unit@v1" => {
          "document_type" => "unit_plan",
          "data_schema" => {
            "type" => "object",
            "required" => [ "title" ],
            "properties" => { "title" => { "type" => "string" } }
          }
        },
        "ib.lesson@v1" => {
          "document_type" => "lesson_plan",
          "data_schema" => {
            "type" => "object",
            "properties" => { "title" => { "type" => "string" } }
          }
        }
      }
    }
  end

  before do
    allow(CurriculumPackStore).to receive(:fetch).and_return(pack_payload)
  end

  describe ".resolve_schema!" do
    it "resolves schema by default_schema_key for the document type" do
      result = described_class.resolve_schema!(
        tenant: tenant,
        pack_key: "ib_continuum_v1",
        pack_version: "2026.1",
        document_type: "unit_plan",
        schema_key: nil
      )

      expect(result[:schema_key]).to eq("ib.unit@v1")
      expect(result.dig(:schema, "document_type")).to eq("unit_plan")
    end

    it "rejects schemas that do not match the document type" do
      expect {
        described_class.resolve_schema!(
          tenant: tenant,
          pack_key: "ib_continuum_v1",
          pack_version: "2026.1",
          document_type: "lesson_plan",
          schema_key: "ib.unit@v1"
        )
      }.to raise_error(Curriculum::PackSchemaResolver::SchemaResolutionError)
    end
  end
end
