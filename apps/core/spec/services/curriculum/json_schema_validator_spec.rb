require "rails_helper"

RSpec.describe Curriculum::JsonSchemaValidator do
  describe ".validate!" do
    let(:schema) do
      {
        "type" => "object",
        "required" => [ "title" ],
        "properties" => {
          "title" => { "type" => "string", "minLength" => 1 },
          "count" => { "type" => "integer" }
        },
        "additionalProperties" => false
      }
    end

    it "passes valid payloads" do
      expect(described_class.validate!(schema: schema, data: { "title" => "Unit 1", "count" => 2 })).to eq(true)
    end

    it "raises a structured ValidationError for invalid payloads" do
      expect {
        described_class.validate!(schema: schema, data: { "count" => "two" })
      }.to raise_error(Curriculum::JsonSchemaValidator::ValidationError) { |error|
        expect(error.errors).to be_an(Array)
        expect(error.errors.first[:data_pointer]).to be_a(String)
      }
    end

    it "rejects remote refs" do
      remote_ref_schema = {
        "type" => "object",
        "$ref" => "https://example.com/schema.json"
      }

      expect {
        described_class.validate!(schema: remote_ref_schema, data: {})
      }.to raise_error(Curriculum::JsonSchemaValidator::ValidationError)
    end
  end
end
