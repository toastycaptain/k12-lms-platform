module Curriculum
  class WorkflowTemplateLibrary
    class << self
      def catalog(pack:)
        pack_data = stringify_keys(pack)
        definitions = stringify_keys(pack_data["workflow_definitions"] || {})
        bindings = stringify_keys(pack_data["workflow_bindings"] || {})

        definitions.map do |key, definition|
          {
            key: key,
            template_scope: key.end_with?("_default") ? "shared_default" : "pack_specific",
            initial_state: definition["initial_state"],
            bound_document_types: bindings.select { |_, binding| binding == key }.keys.sort
          }
        end.sort_by { |row| row[:key] }
      end

      def resolve(pack:, document_type:)
        pack_data = stringify_keys(pack || {})
        bindings = stringify_keys(pack_data["workflow_bindings"] || {})
        definitions = stringify_keys(pack_data["workflow_definitions"] || {})
        key = bindings[document_type.to_s]
        raise WorkflowRegistry::WorkflowError, "No workflow binding for #{document_type}" if key.blank?

        definition = definitions[key.to_s]
        raise WorkflowRegistry::WorkflowError, "No workflow definition #{key}" if definition.nil?

        {
          key: key.to_s,
          definition: definition,
          template_scope: key.to_s.end_with?("_default") ? "shared_default" : "pack_specific"
        }
      end

      private

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
