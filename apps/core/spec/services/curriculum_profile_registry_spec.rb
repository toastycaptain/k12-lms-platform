require "rails_helper"

RSpec.describe CurriculumProfileRegistry do
  before do
    described_class.reset!
  end

  describe ".all" do
    it "loads profiles with canonical v3 fields plus legacy compatibility fields" do
      profiles = described_class.all
      expect(profiles).not_to be_empty

      first = profiles.first
      expect(first).to include("identity", "versioning", "navigation", "planner_object_schemas")
      expect(first).to include("document_types", "document_schemas", "workflow_definitions", "framework_bindings")
      expect(first).to include("key", "label", "version", "planner_taxonomy")
    end
  end

  describe ".validate_profile_payload" do
    it "accepts a v1-shaped payload via adapter" do
      payload = {
        "key" => "custom_profile",
        "label" => "Custom Profile",
        "version" => "2026.1",
        "description" => "Custom profile",
        "jurisdiction" => "US",
        "planner_taxonomy" => {
          "subject_label" => "Subject",
          "grade_label" => "Grade",
          "unit_label" => "Unit"
        },
        "subject_options" => [ "Math" ],
        "grade_or_stage_options" => [ "6" ],
        "framework_defaults" => [ "Common Core" ],
        "template_defaults" => { "default_status" => "draft" },
        "integration_hints" => { "lti_context_tag" => "custom" },
        "status" => "active"
      }

      result = described_class.validate_profile_payload(payload)

      expect(result[:valid]).to be(true)
      expect(result[:errors]).to be_empty
      expect(result[:normalized_profile].dig("identity", "key")).to eq("custom_profile")
      expect(result[:normalized_profile].dig("versioning", "compatibility")).to eq("v1_compatible")
      expect(result[:normalized_profile]).to include("document_types", "document_schemas")
    end

    it "rejects executable content" do
      payload = {
        "identity" => {
          "key" => "unsafe_profile",
          "label" => "Unsafe",
          "description" => "Bad profile",
          "jurisdiction" => "US"
        },
        "versioning" => {
          "version" => "2026.1",
          "compatibility" => "v2_only"
        },
        "terminology" => {
          "subject_label" => "Subject",
          "grade_label" => "Grade",
          "unit_label" => "Unit"
        },
        "navigation" => { "admin" => [ "<script>alert(1)</script>" ] },
        "planner_object_schemas" => {},
        "workflow_bindings" => {},
        "report_bindings" => {},
        "capability_modules" => {},
        "integration_hints" => {},
        "status" => "active"
      }

      result = described_class.validate_profile_payload(payload)

      expect(result[:valid]).to be(false)
      expect(result[:errors]).to include(a_string_matching(/executable content/))
    end

    it "rejects remote refs in document schemas" do
      payload = CurriculumProfileRegistry.find("american_common_core_v1", "2026.1").deep_dup
      payload["document_schemas"]["us.unit@v1"]["data_schema"] = {
        "$ref" => "https://example.com/schema.json"
      }

      result = described_class.validate_profile_payload(payload)

      expect(result[:valid]).to be(false)
      expect(result[:errors]).to include(a_string_matching(/remote JSON schema references/))
    end

    it "rejects malformed document_types schema references" do
      payload = CurriculumProfileRegistry.find("american_common_core_v1", "2026.1").deep_dup
      payload["document_types"]["unit_plan"]["allowed_schema_keys"] = [ "missing_schema" ]
      payload["document_types"]["unit_plan"]["default_schema_key"] = "missing_schema"

      result = described_class.validate_profile_payload(payload)

      expect(result[:valid]).to be(false)
      expect(result[:errors]).to include(a_string_matching(/allowed_schema_keys includes unknown schema/))
    end
  end
end
