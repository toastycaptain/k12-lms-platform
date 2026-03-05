require "rails_helper"

RSpec.describe CurriculumProfileRegistry do
  before do
    described_class.reset!
  end

  describe ".all" do
    it "loads profiles with v2 identity/versioning and legacy compatibility fields" do
      profiles = described_class.all
      expect(profiles).not_to be_empty

      first = profiles.first
      expect(first).to include("identity", "versioning", "navigation", "planner_object_schemas")
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
  end
end
