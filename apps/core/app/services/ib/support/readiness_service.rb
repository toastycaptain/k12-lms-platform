module Ib
  module Support
    class ReadinessService
      class << self
        def document_summary(document)
          content = document.current_version&.content || {}
          required_fields = required_fields_for(document)
          missing_fields = required_fields.filter_map do |field|
            next if present_value?(content[field])

            field
          end

          {
            missing_fields: missing_fields,
            ready: missing_fields.empty?,
            readiness_state: missing_fields.empty? ? "ready" : "blocked",
            blocker_count: missing_fields.length
          }
        rescue Curriculum::PackSchemaResolver::SchemaResolutionError
          {
            missing_fields: [],
            ready: true,
            readiness_state: "unknown",
            blocker_count: 0
          }
        end

        private

        def required_fields_for(document)
          resolved = Curriculum::PackSchemaResolver.resolve_schema!(
            tenant: document.tenant,
            pack_key: document.pack_key,
            pack_version: document.pack_version,
            document_type: document.document_type,
            schema_key: document.schema_key
          )
          Array(resolved.dig(:data_schema, "required")).map(&:to_s)
        end

        def present_value?(value)
          case value
          when String
            value.present?
          when Array, Hash
            value.present?
          else
            !value.nil?
          end
        end
      end
    end
  end
end
