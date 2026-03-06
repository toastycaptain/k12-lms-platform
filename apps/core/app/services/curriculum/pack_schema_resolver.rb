module Curriculum
  class PackSchemaResolver
    class SchemaResolutionError < StandardError
      attr_reader :details

      def initialize(message, details: {})
        @details = details
        super(message)
      end
    end

    class << self
      def resolve_schema!(tenant:, pack_key:, pack_version:, document_type:, schema_key: nil)
        pack = CurriculumPackStore.fetch(tenant: tenant, key: pack_key, version: pack_version)
        raise SchemaResolutionError.new("Pack not found", details: pack_identity(pack_key, pack_version)) if pack.nil?

        schema_key = resolve_schema_key!(pack: pack, document_type: document_type, schema_key: schema_key)
        schema_definitions = stringify_keys(pack["document_schemas"] || {})
        schema = stringify_keys(schema_definitions[schema_key])
        raise SchemaResolutionError.new("Schema not found", details: { schema_key: schema_key }) if schema.nil?

        actual_type = schema["document_type"].to_s
        if actual_type != document_type.to_s
          raise SchemaResolutionError.new(
            "Schema does not match document type",
            details: { schema_key: schema_key, expected_document_type: document_type.to_s, actual_document_type: actual_type }
          )
        end

        {
          schema_key: schema_key,
          schema: schema,
          data_schema: stringify_keys(schema["data_schema"] || {}),
          document_type: document_type.to_s
        }
      end

      def resolve_schema_key!(pack:, document_type:, schema_key: nil)
        pack_data = stringify_keys(pack || {})
        document_types = stringify_keys(pack_data["document_types"] || {})
        document_type_key = document_type.to_s
        type_config = stringify_keys(document_types[document_type_key] || {})

        if type_config.empty?
          raise SchemaResolutionError.new(
            "Unknown document type",
            details: { document_type: document_type_key, available_document_types: document_types.keys }
          )
        end

        allowed_schema_keys = Array(type_config["allowed_schema_keys"]).map(&:to_s)
        selected_key = schema_key.to_s.presence || type_config["default_schema_key"].to_s.presence
        raise SchemaResolutionError.new("No schema_key available for document type", details: { document_type: document_type_key }) if selected_key.nil?

        if allowed_schema_keys.any? && !allowed_schema_keys.include?(selected_key)
          raise SchemaResolutionError.new(
            "Schema key is not allowed for document type",
            details: { schema_key: selected_key, document_type: document_type_key, allowed_schema_keys: allowed_schema_keys }
          )
        end

        selected_key
      end

      private

      def pack_identity(key, version)
        {
          pack_key: key.to_s,
          pack_version: version.to_s.presence
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
end
