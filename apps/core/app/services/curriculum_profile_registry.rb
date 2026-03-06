require "set"

class CurriculumProfileRegistry
  PROFILE_DIR = Rails.root.join("..", "..", "packages", "contracts", "curriculum-profiles").freeze
  PACK_SCHEMA_PATH = PROFILE_DIR.join("pack.v1.schema.json").freeze
  DEFAULT_PROFILE_KEY = "american_common_core_v1".freeze

  REQUIRED_SECTIONS = %w[
    identity
    versioning
    terminology
    navigation
    planner_object_schemas
    document_types
    document_schemas
    workflow_definitions
    workflow_bindings
    framework_bindings
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
      @pack_schema = nil
      @pack_schema_schemer = nil
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
      %w[profile.schema.json profile.v2.schema.json pack.v1.schema.json].include?(filename)
    end

    def normalize_profile(profile)
      candidate = stringify_keys(profile)
      normalized =
        if v3_shape?(candidate)
          normalize_v3_profile(candidate)
        elsif v2_shape?(candidate)
          normalize_v2_to_v3(candidate)
        else
          normalize_v2_to_v3(adapt_v1_to_v2(candidate))
        end

      normalized["status"] = normalize_status(normalized["status"])
      with_legacy_compatibility(normalized)
    end

    def v2_shape?(profile)
      profile.key?("identity") && profile.key?("versioning")
    end

    def v3_shape?(profile)
      profile.key?("document_types") && profile.key?("document_schemas")
    end

    def normalize_v3_profile(profile)
      normalized = stringify_keys(profile.deep_dup)
      normalized["versioning"] = stringify_keys(normalized["versioning"] || {})
      normalized["versioning"]["schema_version"] = normalized["versioning"]["schema_version"].presence || "3.0"
      normalized["versioning"]["compatibility"] = normalized["versioning"]["compatibility"].presence || "v3"
      normalized["navigation"] ||= default_navigation
      normalized["capability_modules"] ||= {}
      normalized["workflow_bindings"] ||= default_workflow_bindings(normalized["document_types"])
      normalized["workflow_definitions"] ||= synthesize_workflow_definitions(normalized["workflow_bindings"])
      normalized["framework_bindings"] ||= synthesize_framework_bindings(normalized)
      normalized["report_bindings"] ||= {}
      normalized["integration_hints"] ||= {}
      normalized["planner_object_schemas"] ||= synthesize_planner_object_schemas(normalized)
      normalized
    end

    def normalize_v2_to_v3(profile)
      normalized = stringify_keys(profile.deep_dup)
      normalized["versioning"] = stringify_keys(normalized["versioning"] || {})
      normalized["versioning"]["schema_version"] = "3.0"
      normalized["versioning"]["compatibility"] = normalized["versioning"]["compatibility"].presence || "v2_only"
      normalized["document_schemas"] = synthesize_document_schemas_from_legacy(normalized["planner_object_schemas"])
      normalized["document_types"] = synthesize_document_types(normalized["document_schemas"])
      normalized["workflow_bindings"] = stringify_keys(normalized["workflow_bindings"] || default_workflow_bindings(normalized["document_types"]))
      normalized["workflow_definitions"] = synthesize_workflow_definitions(normalized["workflow_bindings"])
      normalized["framework_bindings"] = synthesize_framework_bindings(normalized)
      normalized["report_bindings"] ||= {}
      normalized["integration_hints"] ||= {}
      normalized["navigation"] ||= default_navigation
      normalized["capability_modules"] ||= {}
      normalized
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
      normalized = stringify_keys(profile.deep_dup)
      identity = stringify_keys(normalized["identity"] || {})
      versioning = stringify_keys(normalized["versioning"] || {})
      terminology = stringify_keys(normalized["terminology"] || {})
      planner = stringify_keys(normalized["planner_object_schemas"] || {})
      unit_fields = Array(planner.dig("unit_plan", "fields")).map { |field| stringify_keys(field) }
      subject_options = unit_fields.find { |field| field["id"] == "subject" }
      grade_options = unit_fields.find { |field| field["id"] == "grade_or_stage" }
      framework_defaults = Array(
        normalized.dig("framework_bindings", "defaults") ||
        planner.dig("template", "tags") ||
        normalized.dig("report_bindings", "standards_coverage", "default_frameworks")
      ).map(&:to_s)
      template_defaults = stringify_keys(planner.dig("template", "defaults") || normalized["template_defaults"] || {})

      normalized.merge(
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
        "subject_options" => Array(subject_options&.dig("options")).map(&:to_s),
        "grade_or_stage_options" => Array(grade_options&.dig("options")).map(&:to_s),
        "framework_defaults" => framework_defaults,
        "template_defaults" => template_defaults
      )
    end

    def synthesize_document_schemas_from_legacy(planner_object_schemas)
      planner = stringify_keys(planner_object_schemas || {})
      default_types = {
        "unit_plan" => "unit_plan@v1",
        "lesson_plan" => "lesson_plan@v1",
        "template" => "template@v1"
      }

      default_types.each_with_object({}) do |(document_type, schema_key), memo|
        fields = Array(planner.dig(document_type, "fields")).map { |field| stringify_keys(field) }
        data_schema = fields_to_data_schema(fields)

        memo[schema_key] = {
          "document_type" => document_type,
          "label" => document_type.humanize,
          "data_schema" => data_schema,
          "ui_schema" => {
            "sections" => [
              {
                "title" => document_type.humanize,
                "fields" => fields.map { |field| field["id"] }.compact
              }
            ]
          }
        }
      end
    end

    def synthesize_document_types(document_schemas)
      by_type = stringify_keys(document_schemas || {}).each_with_object(Hash.new { |h, k| h[k] = [] }) do |(schema_key, schema), memo|
        doc_type = schema["document_type"].to_s
        next if doc_type.blank?

        memo[doc_type] << schema_key
      end

      by_type.each_with_object({}) do |(document_type, schema_keys), memo|
        memo[document_type] = {
          "label" => document_type.humanize,
          "allowed_schema_keys" => schema_keys.sort,
          "default_schema_key" => schema_keys.sort.first,
          "allowed_statuses" => default_allowed_statuses(document_type),
          "default_status" => "draft",
          "relationships" => default_relationships_for(document_type)
        }
      end
    end

    def default_allowed_statuses(document_type)
      case document_type.to_s
      when "unit_plan"
        %w[draft pending_approval published archived]
      when "template"
        %w[draft published archived]
      else
        %w[draft published archived]
      end
    end

    def default_relationships_for(document_type)
      return {} unless document_type.to_s == "unit_plan"

      {
        "contains" => {
          "allowed_target_types" => [ "lesson_plan" ],
          "max" => 999,
          "ordered" => true
        }
      }
    end

    def synthesize_workflow_definitions(workflow_bindings)
      stringify_keys(workflow_bindings || {}).values.uniq.each_with_object({}) do |workflow_key, memo|
        memo[workflow_key] = workflow_template_for(workflow_key)
      end
    end

    def workflow_template_for(workflow_key)
      key = workflow_key.to_s
      if key.include?("lesson")
        {
          "states" => %w[draft published archived],
          "events" => {
            "publish" => {
              "from" => [ "draft" ],
              "to" => "published",
              "roles" => %w[admin curriculum_lead teacher]
            }
          }
        }
      elsif key.include?("template")
        {
          "states" => %w[draft published archived],
          "events" => {
            "publish" => {
              "from" => [ "draft" ],
              "to" => "published",
              "roles" => %w[admin curriculum_lead teacher]
            },
            "archive" => {
              "from" => [ "published" ],
              "to" => "archived",
              "roles" => %w[admin curriculum_lead teacher]
            }
          }
        }
      else
        {
          "states" => %w[draft pending_approval published archived],
          "events" => {
            "submit_for_approval" => {
              "from" => [ "draft" ],
              "to" => "pending_approval",
              "roles" => %w[admin curriculum_lead teacher],
              "side_effects" => [ { "type" => "create_approval" } ]
            },
            "publish" => {
              "from" => %w[draft pending_approval],
              "to" => "published",
              "roles" => %w[admin curriculum_lead teacher],
              "guards" => [ { "type" => "approval_not_required_or_approved" } ],
              "side_effects" => [ { "type" => "auto_approve_pending" } ]
            },
            "archive" => {
              "from" => [ "published" ],
              "to" => "archived",
              "roles" => %w[admin curriculum_lead teacher]
            }
          }
        }
      end
    end

    def default_workflow_bindings(document_types)
      stringify_keys(document_types || {}).keys.each_with_object({}) do |document_type, memo|
        memo[document_type] = case document_type.to_s
        when "unit_plan"
          "unit_default"
        when "lesson_plan"
          "lesson_default"
        when "template"
          "template_default"
        else
          "#{document_type}_default"
        end
      end
    end

    def synthesize_framework_bindings(profile)
      defaults = Array(
        profile.dig("framework_bindings", "defaults") ||
        profile["framework_defaults"] ||
        profile.dig("report_bindings", "standards_coverage", "default_frameworks")
      ).map(&:to_s).uniq
      allowed = Array(profile.dig("framework_bindings", "allowed")).map(&:to_s)
      allowed |= defaults

      {
        "defaults" => defaults,
        "allowed" => allowed,
        "node_kinds" => Array(profile.dig("framework_bindings", "node_kinds")).presence || [ "standard" ]
      }
    end

    def synthesize_planner_object_schemas(profile)
      terminology = stringify_keys(profile["terminology"] || {})
      template_defaults = stringify_keys(profile["template_defaults"] || {})
      framework_defaults = Array(profile.dig("framework_bindings", "defaults")).map(&:to_s)
      unit_type = stringify_keys(profile.dig("document_types", "unit_plan") || {})
      lesson_type = stringify_keys(profile.dig("document_types", "lesson_plan") || {})

      {
        "unit_plan" => {
          "fields" => [
            {
              "id" => "subject",
              "label" => terminology["subject_label"] || "Subject",
              "component" => "text",
              "required" => true
            },
            {
              "id" => "grade_or_stage",
              "label" => terminology["grade_label"] || "Grade Level",
              "component" => "text",
              "required" => true
            },
            {
              "id" => "title",
              "label" => "#{terminology["unit_label"] || "Unit"} Title",
              "component" => "text",
              "required" => true
            }
          ],
          "status_options" => Array(unit_type["allowed_statuses"])
        },
        "lesson_plan" => {
          "fields" => [
            {
              "id" => "title",
              "label" => "Lesson Title",
              "component" => "text",
              "required" => true
            }
          ],
          "status_options" => Array(lesson_type["allowed_statuses"])
        },
        "template" => {
          "defaults" => template_defaults,
          "tags" => framework_defaults
        }
      }
    end

    def fields_to_data_schema(fields)
      properties = {}
      required_fields = []

      Array(fields).each do |field|
        id = field["id"].to_s
        next if id.blank?

        properties[id] = property_from_field(field)
        required_fields << id if field["required"] == true
      end

      {
        "type" => "object",
        "properties" => properties,
        "required" => required_fields,
        "additionalProperties" => false
      }
    end

    def property_from_field(field)
      component = field["component"].to_s
      options = Array(field["options"]).map(&:to_s)

      case component
      when "date"
        { "type" => "string", "format" => "date" }
      when "checkbox"
        { "type" => "boolean" }
      when "multiselect"
        {
          "type" => "array",
          "items" => options.any? ? { "type" => "string", "enum" => options } : { "type" => "string" }
        }
      when "select"
        options.any? ? { "type" => "string", "enum" => options } : { "type" => "string" }
      when "textarea", "text"
        { "type" => "string" }
      else
        { "type" => "string" }
      end
    end

    def semantic_validation_errors(profile)
      errors = []

      REQUIRED_SECTIONS.each do |section|
        errors << "missing section '#{section}'" unless profile.key?(section)
      end

      key = profile.dig("identity", "key").to_s
      version = profile.dig("versioning", "version").to_s
      errors << "identity.key is required" if key.blank?
      errors << "versioning.version is required" if version.blank?

      status = profile["status"].to_s
      errors << "status must be one of #{LIFECYCLE_STATES.join(', ')}" unless LIFECYCLE_STATES.include?(status)
      errors << "navigation must be an object" unless profile["navigation"].is_a?(Hash)
      errors << "planner_object_schemas must be an object" unless profile["planner_object_schemas"].is_a?(Hash)
      errors << "document_types must be an object" unless profile["document_types"].is_a?(Hash)
      errors << "document_schemas must be an object" unless profile["document_schemas"].is_a?(Hash)
      errors.concat(document_reference_errors(profile))
      errors.concat(validate_against_schema(profile))
      errors.concat(rejection_errors(profile))
      errors.uniq
    end

    def document_reference_errors(profile)
      errors = []
      document_types = stringify_keys(profile["document_types"] || {})
      document_schemas = stringify_keys(profile["document_schemas"] || {})

      document_schemas.each do |schema_key, schema|
        document_type = schema["document_type"].to_s
        next if document_type.present? && document_types.key?(document_type)

        errors << "document_schemas.#{schema_key}.document_type must reference an existing document_types key"
      end

      document_types.each do |document_type, definition|
        allowed_schema_keys = Array(definition["allowed_schema_keys"]).map(&:to_s)
        default_schema_key = definition["default_schema_key"].to_s

        if allowed_schema_keys.empty?
          errors << "document_types.#{document_type}.allowed_schema_keys must include at least one schema key"
        end

        missing_allowed_keys = allowed_schema_keys.reject { |schema_key| document_schemas.key?(schema_key) }
        missing_allowed_keys.each do |schema_key|
          errors << "document_types.#{document_type}.allowed_schema_keys includes unknown schema '#{schema_key}'"
        end

        if default_schema_key.blank?
          errors << "document_types.#{document_type}.default_schema_key is required"
        elsif !allowed_schema_keys.include?(default_schema_key)
          errors << "document_types.#{document_type}.default_schema_key must be present in allowed_schema_keys"
        end
      end

      workflow_bindings = stringify_keys(profile["workflow_bindings"] || {})
      workflow_definitions = stringify_keys(profile["workflow_definitions"] || {})
      workflow_bindings.each do |document_type, workflow_key|
        unless document_types.key?(document_type)
          errors << "workflow_bindings.#{document_type} references unknown document_type"
        end
        unless workflow_definitions.key?(workflow_key.to_s)
          errors << "workflow_bindings.#{document_type} references unknown workflow '#{workflow_key}'"
        end
      end

      errors
    end

    def validate_against_schema(payload)
      schema = pack_v1_schema
      return [] if schema.blank?

      schemer = pack_v1_schemer
      schemer.validate(payload).map do |error|
        pointer = error[:data_pointer].presence || error[:schema_pointer]
        "schema error at #{pointer}: #{error[:error]}"
      end
    rescue StandardError => e
      [ "schema validation failed: #{e.message}" ]
    end

    def rejection_errors(profile)
      errors = []
      errors << "profile includes executable content" if contains_executable_content?(profile)
      errors << "profile includes remote JSON schema references" if contains_remote_refs?(profile["document_schemas"])
      errors << "profile includes unsafe ui_schema content" if contains_unsafe_ui_schema?(profile["document_schemas"])
      errors
    end

    def contains_executable_content?(value)
      case value
      when Hash
        value.any? { |_key, item| contains_executable_content?(item) }
      when Array
        value.any? { |item| contains_executable_content?(item) }
      when String
        value.match?(/<script|javascript:|onerror\s*=|onload\s*=/i)
      else
        false
      end
    end

    def contains_remote_refs?(value)
      case value
      when Hash
        value.any? do |key, item|
          (key.to_s == "$ref" && item.to_s.match?(%r{\Ahttps?://}i)) || contains_remote_refs?(item)
        end
      when Array
        value.any? { |item| contains_remote_refs?(item) }
      else
        false
      end
    end

    def contains_unsafe_ui_schema?(value)
      case value
      when Hash
        value.any? do |key, item|
          if key.to_s == "ui_schema"
            contains_executable_content?(item)
          else
            contains_unsafe_ui_schema?(item)
          end
        end
      when Array
        value.any? { |item| contains_unsafe_ui_schema?(item) }
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
      normalize_profile(
        {
          "identity" => {
            "key" => DEFAULT_PROFILE_KEY,
            "label" => "American (Common Core + NGSS)",
            "description" => "Built-in fallback profile",
            "jurisdiction" => "US"
          },
          "versioning" => {
            "version" => "fallback",
            "compatibility" => "v3",
            "schema_version" => "3.0"
          },
          "status" => "active",
          "terminology" => {
            "subject_label" => "Subject",
            "grade_label" => "Grade Level",
            "unit_label" => "Unit"
          },
          "navigation" => default_navigation,
          "capability_modules" => {
            "portfolio" => true
          },
          "document_types" => {
            "unit_plan" => {
              "label" => "Unit",
              "allowed_schema_keys" => [ "unit_plan@v1" ],
              "default_schema_key" => "unit_plan@v1",
              "allowed_statuses" => %w[draft pending_approval published archived],
              "default_status" => "draft",
              "relationships" => default_relationships_for("unit_plan")
            },
            "lesson_plan" => {
              "label" => "Lesson",
              "allowed_schema_keys" => [ "lesson_plan@v1" ],
              "default_schema_key" => "lesson_plan@v1",
              "allowed_statuses" => %w[draft published archived],
              "default_status" => "draft"
            },
            "template" => {
              "label" => "Template",
              "allowed_schema_keys" => [ "template@v1" ],
              "default_schema_key" => "template@v1",
              "allowed_statuses" => %w[draft published archived],
              "default_status" => "draft"
            }
          },
          "document_schemas" => {
            "unit_plan@v1" => {
              "document_type" => "unit_plan",
              "label" => "Unit Plan",
              "data_schema" => {
                "type" => "object",
                "required" => [ "title" ],
                "properties" => {
                  "title" => { "type" => "string", "minLength" => 1 }
                },
                "additionalProperties" => false
              }
            },
            "lesson_plan@v1" => {
              "document_type" => "lesson_plan",
              "label" => "Lesson Plan",
              "data_schema" => {
                "type" => "object",
                "properties" => {
                  "title" => { "type" => "string", "minLength" => 1 }
                },
                "additionalProperties" => false
              }
            },
            "template@v1" => {
              "document_type" => "template",
              "label" => "Template",
              "data_schema" => {
                "type" => "object",
                "properties" => {
                  "title" => { "type" => "string", "minLength" => 1 }
                },
                "additionalProperties" => false
              }
            }
          },
          "workflow_bindings" => {
            "unit_plan" => "unit_default",
            "lesson_plan" => "lesson_default",
            "template" => "template_default"
          },
          "workflow_definitions" => {
            "unit_default" => workflow_template_for("unit_default"),
            "lesson_default" => workflow_template_for("lesson_default"),
            "template_default" => workflow_template_for("template_default")
          },
          "framework_bindings" => {
            "defaults" => [ "Common Core", "NGSS" ],
            "allowed" => [ "Common Core", "NGSS" ],
            "node_kinds" => [ "standard" ]
          },
          "report_bindings" => {
            "standards_coverage" => {
              "default_frameworks" => [ "Common Core", "NGSS" ]
            }
          },
          "integration_hints" => {
            "google_addon_context" => "us_standard",
            "lti_context_tag" => "us_ccss",
            "oneroster_context_tag" => "us_default"
          }
        }
      )
    end

    def pack_v1_schema
      return @pack_schema if defined?(@pack_schema)
      return (@pack_schema = nil) unless File.exist?(PACK_SCHEMA_PATH)

      @pack_schema = JSON.parse(File.read(PACK_SCHEMA_PATH))
    rescue JSON::ParserError => e
      Rails.logger.warn("[CurriculumProfileRegistry] Failed to parse pack schema: #{e.message}")
      @pack_schema = nil
    end

    def pack_v1_schemer
      @pack_schema_schemer ||= JSONSchemer.schema(pack_v1_schema)
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
