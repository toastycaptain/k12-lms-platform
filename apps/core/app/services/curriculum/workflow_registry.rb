module Curriculum
  class WorkflowRegistry
    class WorkflowError < StandardError; end

    class << self
      def workflow_for!(pack:, document_type:)
        pack_data = stringify_keys(pack || {})
        workflow_bindings = stringify_keys(pack_data["workflow_bindings"] || {})
        workflow_definitions = stringify_keys(pack_data["workflow_definitions"] || {})
        key = workflow_bindings[document_type.to_s]
        raise WorkflowError, "No workflow binding for #{document_type}" if key.blank?

        definition = workflow_definitions[key.to_s]
        raise WorkflowError, "No workflow definition #{key}" if definition.nil?

        {
          key: key.to_s,
          definition: definition
        }
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
