module Curriculum
  class DocumentTemplateRegistry
    CORE_TEMPLATE_TYPES = %w[unit_plan lesson_plan template].freeze

    class << self
      def catalog(pack:)
        pack_data = stringify_keys(pack)
        document_types = stringify_keys(pack_data["document_types"] || {})
        schema_index = stringify_keys(pack_data["document_schema_index"] || {})

        document_types.map do |document_type, definition|
          index_entry = stringify_keys(schema_index[document_type] || {})
          {
            key: document_type,
            label: definition["label"].presence || document_type.humanize,
            default_schema_key: definition["default_schema_key"].presence || index_entry["default_schema_key"],
            allowed_schema_keys: Array(definition["allowed_schema_keys"]).presence || Array(index_entry["allowed_schema_keys"]),
            inherited_from: inherited_from(document_type),
            workflow_binding: stringify_keys(pack_data["workflow_bindings"] || {})[document_type],
            relationships: stringify_keys(definition["relationships"] || index_entry["relationships"] || {})
          }
        end.sort_by { |row| row[:key] }
      end

      def template_for(pack:, document_type:)
        catalog(pack: pack).find { |row| row[:key] == document_type.to_s }
      end

      private

      def inherited_from(document_type)
        key = document_type.to_s
        return "core_planner_document" if CORE_TEMPLATE_TYPES.include?(key)
        return "ib_pyp_base" if key.start_with?("ib_pyp")
        return "ib_myp_base" if key.start_with?("ib_myp")
        return "ib_dp_base" if key.start_with?("ib_dp")

        "pack_specific"
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
