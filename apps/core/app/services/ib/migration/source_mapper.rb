module Ib
  module Migration
    class SourceMapper
      class << self
        def map_row(source_system:, source_kind:, payload:)
          contract = ContractRegistry.definition_for(source_system: source_system, source_kind: source_kind)
          normalized = normalize_payload(payload, aliases: contract[:aliases] || {})
          unsupported_fields = normalized.keys - Array(contract[:supported_fields]).map(&:to_s)
          case source_kind.to_s
          when "pyp_poi"
            map_pyp_poi(normalized, source_system: source_system, unsupported_fields: unsupported_fields)
          when "curriculum_document"
            map_curriculum_document(normalized, source_system: source_system, unsupported_fields: unsupported_fields)
          when "operational_record"
            map_operational_record(normalized, source_system: source_system, unsupported_fields: unsupported_fields)
          when "staff_role"
            map_staff_role(normalized, unsupported_fields: unsupported_fields)
          else
            {
              normalized_payload: normalized,
              warnings: [ "No mapper defined for #{source_kind}; row stored as generic payload." ],
              unsupported_fields: unsupported_fields
            }
          end
        end

        def apply_mapping(normalized_payload:, mapping_payload:)
          mapping = mapping_payload.to_h.stringify_keys.compact_blank
          return normalized_payload if mapping.blank?

          normalized_payload.to_h.merge(mapping)
        end

        private

        def map_pyp_poi(payload, source_system:, unsupported_fields:)
          {
            normalized_payload: {
              year_level: payload["year_level"] || payload["grade"] || payload["year"],
              theme: payload["theme"] || payload["transdisciplinary_theme"],
              title: payload["title"] || payload["unit_title"],
              central_idea: payload["central_idea"],
              review_state: payload["review_state"] || payload["status"] || "draft",
              source_system: source_system
            }.compact,
            warnings: payload["teacher_notes"].present? || payload["review_comment"].present? ? [ "Source-only review notes were preserved for operator review." ] : [],
            unsupported_fields: unsupported_fields
          }
        end

        def map_curriculum_document(payload, source_system:, unsupported_fields:)
          content = payload["content_json"]
          parsed_content = parse_json(content)
          {
            normalized_payload: {
              planning_context_name: payload["planning_context_name"] || payload["context"] || payload["course_name"],
              document_type: payload["document_type"] || payload["type"] || "ib_pyp_unit",
              title: payload["title"] || payload["unit_title"],
              schema_key: payload["schema_key"],
              status: payload["status"] || "draft",
              content: parsed_content,
              source_system: source_system
            }.compact,
            warnings: content.present? && parsed_content.empty? ? [ "content_json could not be parsed; imported as empty object." ] : [],
            unsupported_fields: unsupported_fields
          }
        end

        def map_operational_record(payload, source_system:, unsupported_fields:)
          {
            normalized_payload: {
              programme: payload["programme"] || "Mixed",
              record_family: payload["record_family"] || payload["family"] || "misc",
              subtype: payload["subtype"] || payload["type"] || "item",
              title: payload["title"],
              summary: payload["summary"],
              next_action: payload["next_action"],
              status: payload["status"] || "draft",
              priority: payload["priority"] || "normal",
              risk_level: payload["risk_level"] || "healthy",
              route_hint: payload["route_hint"],
              source_system: source_system
            }.compact,
            warnings: payload["candidate_ref"].present? ? [ "Source candidate ref was preserved for duplicate review." ] : [],
            unsupported_fields: unsupported_fields
          }
        end

        def map_staff_role(payload, unsupported_fields:)
          {
            normalized_payload: {
              school_name: payload["school_name"] || payload["school"],
              programme: payload["programme"] || "Mixed",
              academic_year_name: payload["academic_year_name"] || payload["academic_year"],
              user_email: payload["user_email"] || payload["email"],
              role_name: payload["role_name"] || payload["role"]
            }.compact,
            warnings: [],
            unsupported_fields: unsupported_fields
          }
        end

        def normalize_payload(payload, aliases:)
          payload.to_h.each_with_object({}) do |(key, value), memo|
            normalized_key = normalize_key(key)
            mapped_key = aliases.fetch(normalized_key, normalized_key)
            memo[mapped_key] = normalize_value(value)
          end
        end

        def parse_json(value)
          return {} if value.blank?
          return value if value.is_a?(Hash)

          JSON.parse(value.to_s)
        rescue JSON::ParserError
          {}
        end

        def normalize_key(key)
          key.to_s.strip.downcase.gsub(/[\s\-\/]+/, "_")
        end

        def normalize_value(value)
          case value
          when Date
            value.iso8601
          when Time, DateTime
            value.iso8601
          else
            value
          end
        end
      end
    end
  end
end
