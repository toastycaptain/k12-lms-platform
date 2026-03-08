module Ib
  module Ai
    class GuardrailService
      class GuardrailViolation < StandardError; end

      DEFAULT_TENANT_CONTROLS = {
        "enabled" => true,
        "allow_guardian_translation" => false,
        "pii_redaction" => true,
        "max_grounding_refs" => 4,
        "max_excerpt_chars" => 280,
        "max_source_chars" => 2400
      }.freeze

      ALLOWED_CONTEXT_KEYS = %w[
        workflow
        programme
        audience
        source
        return_url
        locale
        document_id
        document_title
        document_type
        selection_text
        source_text
        report_title
        report_summary
        story_title
        story_summary
        reflection_prompt
        reflection_response
        requested_action
        requested_tone
        current_values
        target_fields
        grounding_refs
        glossary_terms
      ].freeze

      EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
      PHONE_PATTERN = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}/
      STUDENT_ID_PATTERN = /\b\d{7,}\b/

      def initialize(user:, task_definition:)
        @user = user
        @task_definition = task_definition
      end

      def sanitize(context)
        raw = stringify_keys(context)
        blocked_action = raw["requested_action"].to_s
        if task_definition[:human_only_boundaries].include?(blocked_action)
          raise GuardrailViolation, "#{blocked_action} is human-only for #{task_definition[:label]}"
        end

        safe = raw.slice(*ALLOWED_CONTEXT_KEYS)
        safe["current_values"] = sanitize_map(raw["current_values"], max_value_length: 1_000)
        safe["target_fields"] = sanitize_fields(raw["target_fields"])
        safe["glossary_terms"] = sanitize_glossary_terms(raw["glossary_terms"])
        safe["grounding_refs"] = sanitize_grounding_refs(raw["grounding_refs"])
        safe["source_text"] = derive_source_text(raw, safe["current_values"])

        if task_definition[:grounding_required] && safe["grounding_refs"].blank? && safe["source_text"].blank?
          raise GuardrailViolation, "Grounded source text is required for #{task_definition[:label]}"
        end

        safe.compact
      end

      def tenant_controls
        controls =
          if user.tenant&.settings.is_a?(Hash)
            user.tenant.settings.fetch("ib_ai_assist", {})
          else
            {}
          end

        DEFAULT_TENANT_CONTROLS.merge(stringify_keys(controls))
      end

      class << self
        def default_tenant_controls
          DEFAULT_TENANT_CONTROLS.deep_dup
        end
      end

      private

      attr_reader :user, :task_definition

      def sanitize_map(value, max_value_length:)
        return {} unless value.is_a?(Hash)

        stringify_keys(value).each_with_object({}) do |(key, item), memo|
          memo[key] = truncate(redact_text(item.to_s), max_value_length) if item.present?
        end
      end

      def sanitize_fields(value)
        Array(value).first(8).filter_map do |field|
          record = stringify_keys(field)
          next if record["field"].blank?

          {
            "field" => record["field"].to_s,
            "label" => truncate(record["label"].presence || record["field"], 80)
          }
        end
      end

      def sanitize_glossary_terms(value)
        Array(value).first(8).filter_map do |item|
          record = stringify_keys(item)
          next if record["term"].blank?

          {
            "term" => truncate(record["term"], 80),
            "preferred" => truncate(record["preferred"], 160)
          }
        end
      end

      def sanitize_grounding_refs(value)
        Array(value).first(tenant_controls["max_grounding_refs"].to_i).filter_map do |item|
          record = stringify_keys(item)
          excerpt = redact_text(record["excerpt"].to_s)
          next if record["label"].blank? && excerpt.blank?

          {
            "type" => truncate(record["type"], 40),
            "label" => truncate(record["label"], 120),
            "excerpt" => truncate(excerpt, tenant_controls["max_excerpt_chars"].to_i)
          }.compact
        end
      end

      def derive_source_text(raw, current_values)
        candidates = [
          raw["source_text"],
          raw["selection_text"],
          raw["reflection_response"],
          raw["report_summary"],
          raw["story_summary"],
          current_values.values.join("\n")
        ]
        value = candidates.find(&:present?).to_s
        truncate(redact_text(value), tenant_controls["max_source_chars"].to_i).presence
      end

      def redact_text(value)
        return value.to_s unless tenant_controls["pii_redaction"]

        value.to_s
             .gsub(EMAIL_PATTERN, "[redacted-email]")
             .gsub(PHONE_PATTERN, "[redacted-phone]")
             .gsub(STUDENT_ID_PATTERN, "[redacted-id]")
      end

      def truncate(value, limit)
        return nil if value.blank?

        value.to_s.first(limit)
      end

      def stringify_keys(value)
        case value
        when Hash
          value.each_with_object({}) { |(key, item), memo| memo[key.to_s] = stringify_keys(item) }
        when Array
          value.map { |item| stringify_keys(item) }
        else
          value
        end
      end
    end
  end
end
