module Curriculum
  class DocumentContentService
    MAX_JSON_BYTES = 2.megabytes
    MAX_STRING_LENGTH = 100_000

    class << self
      def validate_content!(tenant:, pack_key:, pack_version:, document_type:, schema_key:, content:, enforce_validation: nil)
        raise ArgumentError, "content must be a Hash" unless content.is_a?(Hash)

        json_bytes = content.to_json.bytesize
        raise ArgumentError, "content too large" if json_bytes > MAX_JSON_BYTES

        if oversized_string_present?(content)
          raise ArgumentError, "content includes string fields that exceed max length"
        end

        should_validate = enforce_validation.nil? ? schema_validation_enabled?(tenant: tenant) : !!enforce_validation
        return true unless should_validate

        schema_resolution = Curriculum::PackSchemaResolver.resolve_schema!(
          tenant: tenant,
          pack_key: pack_key,
          pack_version: pack_version,
          document_type: document_type,
          schema_key: schema_key
        )

        Curriculum::JsonSchemaValidator.validate!(
          schema: schema_resolution[:data_schema],
          data: content
        )

        true
      end

      private

      def schema_validation_enabled?(tenant:)
        return false if tenant.nil?

        FeatureFlag.enabled?("curriculum_document_schema_validation_v1", tenant: tenant)
      end

      def oversized_string_present?(value)
        case value
        when Hash
          value.any? { |_key, item| oversized_string_present?(item) }
        when Array
          value.any? { |item| oversized_string_present?(item) }
        when String
          value.length > MAX_STRING_LENGTH
        else
          false
        end
      end
    end
  end
end
