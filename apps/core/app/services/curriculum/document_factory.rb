require "digest"

module Curriculum
  class DocumentFactory
    class FactoryError < StandardError; end

    class << self
      def create!(planning_context:, document_type:, title:, created_by:, schema_key: nil, initial_content: {})
        normalized_initial_content =
          if initial_content.respond_to?(:to_unsafe_h)
            initial_content.to_unsafe_h
          elsif initial_content.respond_to?(:to_h) && !initial_content.is_a?(Hash)
            initial_content.to_h
          else
            initial_content
          end

        tenant = planning_context.tenant
        course = planning_context.courses.first
        resolved = CurriculumProfileResolver.resolve(
          tenant: tenant,
          school: planning_context.school,
          course: course,
          academic_year: planning_context.academic_year
        )

        pack_payload = CurriculumPackStore.fetch(
          tenant: tenant,
          key: resolved[:profile_key],
          version: resolved[:resolved_profile_version]
        )
        raise FactoryError, "Unable to resolve pack payload for #{resolved[:profile_key]}" if pack_payload.nil?

        selected_schema_key = Curriculum::PackSchemaResolver.resolve_schema_key!(
          pack: pack_payload,
          document_type: document_type,
          schema_key: schema_key
        )
        document_type_config = stringify_keys(pack_payload.dig("document_types", document_type.to_s) || {})
        default_status = document_type_config["default_status"].to_s.presence || "draft"

        document = CurriculumDocument.create!(
          tenant: tenant,
          school: planning_context.school,
          academic_year: planning_context.academic_year,
          planning_context: planning_context,
          document_type: document_type.to_s,
          title: title,
          status: default_status,
          created_by: created_by,
          pack_key: resolved[:profile_key],
          pack_version: resolved[:resolved_profile_version],
          schema_key: selected_schema_key,
          pack_payload_checksum: Digest::SHA256.hexdigest(pack_payload.to_json)
        )

        document.create_version!(
          title: title,
          content: normalized_initial_content.is_a?(Hash) ? normalized_initial_content : {},
          created_by: created_by
        )

        document
      rescue Curriculum::PackSchemaResolver::SchemaResolutionError => e
        raise FactoryError, e.message
      end

      private

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
end
