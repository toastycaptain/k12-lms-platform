require "set"

class CurriculumProfileRegistry
  PROFILE_DIR = Rails.root.join("..", "..", "packages", "contracts", "curriculum-profiles").freeze
  DEFAULT_PROFILE_KEY = "american_common_core_v1".freeze
  REQUIRED_FIELDS = %w[
    key
    label
    version
    description
    jurisdiction
    planner_taxonomy
    subject_options
    grade_or_stage_options
    framework_defaults
    template_defaults
    integration_hints
    status
  ].freeze

  class << self
    def all
      @all ||= load_profiles
    end

    def reset!
      @all = nil
    end

    def find(key)
      return nil if key.blank?

      all.find { |profile| profile["key"] == key }
    end

    def keys
      all.map { |profile| profile["key"] }
    end

    def default_profile_key
      DEFAULT_PROFILE_KEY
    end

    def fallback_profile
      find(DEFAULT_PROFILE_KEY) || all.first || minimal_fallback_profile
    end

    private

    def load_profiles
      pattern = PROFILE_DIR.join("*.json")
      profile_files = Dir.glob(pattern).reject { |path| path.end_with?("profile.schema.json") }.sort

      profiles = profile_files.map do |path|
        parsed = JSON.parse(File.read(path))
        unless valid_profile?(parsed)
          Rails.logger.warn("[CurriculumProfileRegistry] Invalid profile definition at #{path}")
          next
        end

        parsed
      rescue JSON::ParserError => e
        Rails.logger.warn("[CurriculumProfileRegistry] Failed to parse #{path}: #{e.message}")
        nil
      end.compact

      deduped_profiles = []
      seen_keys = Set.new
      profiles.each do |profile|
        key = profile["key"].to_s
        if seen_keys.include?(key)
          Rails.logger.warn("[CurriculumProfileRegistry] Duplicate profile key skipped: #{key}")
          next
        end

        seen_keys.add(key)
        deduped_profiles << profile
      end

      deduped_profiles.sort_by { |profile| profile["label"].to_s }
    end

    def minimal_fallback_profile
      {
        "key" => DEFAULT_PROFILE_KEY,
        "label" => "American (Common Core + NGSS)",
        "version" => "fallback",
        "description" => "Built-in fallback profile",
        "jurisdiction" => "US",
        "planner_taxonomy" => {
          "subject_label" => "Subject",
          "grade_label" => "Grade Level",
          "unit_label" => "Unit"
        },
        "subject_options" => %w[Math Science ELA Social\ Studies Arts PE],
        "grade_or_stage_options" => [ "K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12" ],
        "framework_defaults" => [ "Common Core", "NGSS", "C3 Framework" ],
        "template_defaults" => {
          "default_status" => "draft",
          "suggested_sections" => [ "Essential Questions", "Standards Alignment", "Assessment Plan" ]
        },
        "integration_hints" => {
          "google_addon_context" => "us_standard",
          "lti_context_tag" => "us_ccss",
          "oneroster_context_tag" => "us_default"
        },
        "status" => "active"
      }
    end

    def valid_profile?(profile)
      return false unless profile.is_a?(Hash)

      REQUIRED_FIELDS.all? { |field| profile.key?(field) }
    end
  end
end
