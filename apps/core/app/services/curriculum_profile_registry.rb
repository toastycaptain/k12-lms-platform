require "set"

class CurriculumProfileRegistry
  PROFILE_DIR = Rails.root.join("..", "..", "packages", "contracts", "curriculum-profiles").freeze
  DEFAULT_PROFILE_KEY = "american_common_core_v1".freeze

  REQUIRED_V2_SECTIONS = %w[
    identity
    versioning
    terminology
    navigation
    planner_object_schemas
    workflow_bindings
    report_bindings
    capability_modules
    integration_hints
    status
  ].freeze

  LIFECYCLE_STATES = %w[draft active deprecated frozen].freeze

  class << self
    def all
      @all ||= load_profiles
    end

    def reset!
      @all = nil
    end

    def find(key, version = nil)
      return nil if key.blank?

      matches = all.select { |profile| profile.dig("identity", "key") == key || profile["key"] == key }
      return nil if matches.empty?

      if version.present?
        return matches.find { |profile| profile.dig("versioning", "version") == version || profile["version"] == version }
      end

      published = matches.find { |profile| profile["status"] == "active" }
      published || latest_profile(matches)
    end

    def exists?(key, version = nil)
      find(key, version).present?
    end

    def keys
      all.map { |profile| profile.dig("identity", "key") }.uniq
    end

    def versions_for(key)
      all
        .select { |profile| profile.dig("identity", "key") == key }
        .map { |profile| profile.dig("versioning", "version") }
        .uniq
        .sort
    end

    def default_profile_key
      DEFAULT_PROFILE_KEY
    end

    def fallback_profile
      find(DEFAULT_PROFILE_KEY) || latest_profile(all) || minimal_fallback_profile
    end

    def validate_profile_payload(payload)
      normalized = normalize_profile(payload)
      errors = semantic_validation_errors(normalized)

      {
        valid: errors.empty?,
        normalized_profile: normalized,
        errors: errors
      }
    rescue StandardError => e
      {
        valid: false,
        normalized_profile: nil,
        errors: [ "Invalid payload: #{e.message}" ]
      }
    end

    private

    def load_profiles
      profile_files = Dir.glob(PROFILE_DIR.join("*.json")).reject { |path| schema_artifact?(path) }.sort
      loaded = []
      seen = Set.new

      profile_files.each do |path|
        parsed = JSON.parse(File.read(path))
        normalized = normalize_profile(parsed)
        errors = semantic_validation_errors(normalized)

        if errors.any?
          Rails.logger.warn("[CurriculumProfileRegistry] Invalid profile definition at #{path}: #{errors.join('; ')}")
          next
        end

        identity = normalized.dig("identity", "key").to_s
        version = normalized.dig("versioning", "version").to_s
        dedupe_key = "#{identity}:#{version}"

        if seen.include?(dedupe_key)
          Rails.logger.warn("[CurriculumProfileRegistry] Duplicate profile identity/version skipped: #{dedupe_key}")
          next
        end

        seen.add(dedupe_key)
        loaded << normalized
      rescue JSON::ParserError => e
        Rails.logger.warn("[CurriculumProfileRegistry] Failed to parse #{path}: #{e.message}")
      rescue StandardError => e
        Rails.logger.warn("[CurriculumProfileRegistry] Failed to normalize #{path}: #{e.message}")
      end

      loaded.sort_by { |profile| [ profile.dig("identity", "label").to_s, profile.dig("versioning", "version").to_s ] }
    end

    def schema_artifact?(path)
      filename = File.basename(path)
      filename == "profile.schema.json" || filename == "profile.v2.schema.json"
    end

    def normalize_profile(profile)
      candidate = stringify_keys(profile)
      normalized = if v2_shape?(candidate)
        candidate
      else
        adapt_v1_to_v2(candidate)
      end

      merged = with_legacy_compatibility(normalized)
      merged["status"] = normalize_status(merged["status"])
      merged
    end

    def v2_shape?(profile)
      profile.key?("identity") && profile.key?("versioning")
    end

    def adapt_v1_to_v2(profile)
      taxonomy = stringify_keys(profile["planner_taxonomy"] || {})
      subject_options = Array(profile["subject_options"]).map(&:to_s)
      grade_options = Array(profile["grade_or_stage_options"]).map(&:to_s)
      framework_defaults = Array(profile["framework_defaults"]).map(&:to_s)
      template_defaults = stringify_keys(profile["template_defaults"] || {})

      {
        "identity" => {
          "key" => profile["key"],
          "label" => profile["label"],
          "description" => profile["description"],
          "jurisdiction" => profile["jurisdiction"]
        },
        "versioning" => {
          "version" => profile["version"],
          "compatibility" => "v1_compatible",
          "schema_version" => "2.0"
        },
        "terminology" => {
          "subject_label" => taxonomy["subject_label"] || "Subject",
          "grade_label" => taxonomy["grade_label"] || "Grade Level",
          "unit_label" => taxonomy["unit_label"] || "Unit"
        },
        "navigation" => default_navigation,
        "planner_object_schemas" => {
          "unit_plan" => {
            "fields" => [
              {
                "id" => "subject",
                "label" => taxonomy["subject_label"] || "Subject",
                "component" => "select",
                "options" => subject_options,
                "required" => true
              },
              {
                "id" => "grade_or_stage",
                "label" => taxonomy["grade_label"] || "Grade Level",
                "component" => "select",
                "options" => grade_options,
                "required" => true
              },
              {
                "id" => "title",
                "label" => "#{taxonomy["unit_label"] || "Unit"} Title",
                "component" => "text",
                "required" => true
              }
            ]
          },
          "template" => {
            "defaults" => template_defaults,
            "tags" => framework_defaults
          },
          "lesson_plan" => {
            "fields" => [
              {
                "id" => "title",
                "label" => "Lesson Title",
                "component" => "text",
                "required" => true
              }
            ]
          }
        },
        "workflow_bindings" => {
          "unit_plan" => "unit_plan_default_v1",
          "template" => "template_default_v1",
          "lesson_plan" => "lesson_plan_default_v1"
        },
        "report_bindings" => {
          "standards_coverage" => {
            "default_frameworks" => framework_defaults
          }
        },
        "capability_modules" => {
          "portfolio" => true,
          "interventions" => false,
          "pastoral" => false,
          "advanced_reports" => true
        },
        "integration_hints" => stringify_keys(profile["integration_hints"] || {}),
        "status" => profile["status"] || "active",
        "source_profile_type" => "v1_adapted"
      }
    end

    def with_legacy_compatibility(profile)
      identity = stringify_keys(profile["identity"] || {})
      versioning = stringify_keys(profile["versioning"] || {})
      terminology = stringify_keys(profile["terminology"] || {})
      planner = stringify_keys(profile["planner_object_schemas"] || {})
      template_defaults = stringify_keys(planner.dig("template", "defaults") || {})
      framework_defaults = Array(planner.dig("template", "tags") || profile.dig("report_bindings", "standards_coverage", "default_frameworks"))
      subject_options = Array(planner.dig("unit_plan", "fields")).find { |field| stringify_keys(field)["id"] == "subject" }
      grade_options = Array(planner.dig("unit_plan", "fields")).find { |field| stringify_keys(field)["id"] == "grade_or_stage" }

      profile.merge(
        "key" => identity["key"],
        "label" => identity["label"],
        "version" => versioning["version"],
        "description" => identity["description"],
        "jurisdiction" => identity["jurisdiction"],
        "planner_taxonomy" => {
          "subject_label" => terminology["subject_label"] || "Subject",
          "grade_label" => terminology["grade_label"] || "Grade Level",
          "unit_label" => terminology["unit_label"] || "Unit"
        },
        "subject_options" => Array(stringify_keys(subject_options || {})["options"]).map(&:to_s),
        "grade_or_stage_options" => Array(stringify_keys(grade_options || {})["options"]).map(&:to_s),
        "framework_defaults" => framework_defaults.map(&:to_s),
        "template_defaults" => template_defaults,
        "integration_hints" => stringify_keys(profile["integration_hints"] || {})
      )
    end

    def default_navigation
      {
        "admin" => %w[dashboard plan teach assess admin report communicate],
        "curriculum_lead" => %w[dashboard plan assess report communicate],
        "teacher" => %w[dashboard plan teach assess report communicate],
        "student" => %w[learn communicate],
        "guardian" => %w[guardian communicate],
        "district_admin" => %w[district report]
      }
    end

    def semantic_validation_errors(profile)
      errors = []
      REQUIRED_V2_SECTIONS.each do |section|
        errors << "missing section '#{section}'" unless profile.key?(section)
      end

      key = profile.dig("identity", "key").to_s
      version = profile.dig("versioning", "version").to_s
      errors << "identity.key is required" if key.blank?
      errors << "versioning.version is required" if version.blank?

      status = profile["status"].to_s
      errors << "status must be one of #{LIFECYCLE_STATES.join(', ')}" unless LIFECYCLE_STATES.include?(status)

      navigation = profile["navigation"]
      unless navigation.is_a?(Hash)
        errors << "navigation must be an object"
      end

      planner_schemas = profile["planner_object_schemas"]
      unless planner_schemas.is_a?(Hash)
        errors << "planner_object_schemas must be an object"
      end

      errors.concat(rejection_errors(profile))
      errors.uniq
    end

    def rejection_errors(profile)
      errors = []
      if contains_executable_content?(profile)
        errors << "profile includes executable content"
      end

      errors
    end

    def contains_executable_content?(value)
      case value
      when Hash
        value.any? { |_key, item| contains_executable_content?(item) }
      when Array
        value.any? { |item| contains_executable_content?(item) }
      when String
        value.match?(/<script|javascript:|onerror\\s*=|onload\\s*=/i)
      else
        false
      end
    end

    def normalize_status(value)
      normalized = value.to_s
      return normalized if LIFECYCLE_STATES.include?(normalized)

      normalized == "active" ? normalized : "draft"
    end

    def latest_profile(profiles)
      profiles.max_by do |profile|
        [
          profile.dig("versioning", "version").to_s,
          profile.dig("identity", "label").to_s,
          profile["status"] == "active" ? 1 : 0
        ]
      end
    end

    def minimal_fallback_profile
      with_legacy_compatibility(
        {
          "identity" => {
            "key" => DEFAULT_PROFILE_KEY,
            "label" => "American (Common Core + NGSS)",
            "version" => "fallback",
            "description" => "Built-in fallback profile",
            "jurisdiction" => "US"
          },
          "versioning" => {
            "version" => "fallback",
            "compatibility" => "v2_only",
            "schema_version" => "2.0"
          },
          "terminology" => {
            "subject_label" => "Subject",
            "grade_label" => "Grade Level",
            "unit_label" => "Unit"
          },
          "navigation" => default_navigation,
          "planner_object_schemas" => {
            "unit_plan" => {
              "fields" => [
                { "id" => "subject", "label" => "Subject", "component" => "select", "options" => %w[Math Science ELA], "required" => true },
                { "id" => "grade_or_stage", "label" => "Grade Level", "component" => "select", "options" => %w[K 1 2 3 4 5], "required" => true },
                { "id" => "title", "label" => "Unit Title", "component" => "text", "required" => true }
              ]
            },
            "template" => {
              "defaults" => {
                "default_status" => "draft",
                "suggested_sections" => [ "Essential Questions", "Standards Alignment", "Assessment Plan" ]
              },
              "tags" => [ "Common Core", "NGSS" ]
            }
          },
          "workflow_bindings" => {
            "unit_plan" => "unit_plan_default_v1",
            "template" => "template_default_v1",
            "lesson_plan" => "lesson_plan_default_v1"
          },
          "report_bindings" => {
            "standards_coverage" => {
              "default_frameworks" => [ "Common Core", "NGSS" ]
            }
          },
          "capability_modules" => {
            "portfolio" => true,
            "interventions" => false,
            "pastoral" => false,
            "advanced_reports" => true
          },
          "integration_hints" => {
            "google_addon_context" => "us_standard",
            "lti_context_tag" => "us_ccss",
            "oneroster_context_tag" => "us_default"
          },
          "status" => "active"
        }
      )
    end

    def stringify_keys(value)
      case value
      when Hash
        value.each_with_object({}) do |(key, item), memo|
          memo[key.to_s] = stringify_keys(item)
        end
      when Array
        value.map { |item| stringify_keys(item) }
      else
        value
      end
    end
  end
end
