module Curriculum
  class WorkflowRegistry
    class WorkflowError < StandardError; end

    class << self
      def workflow_for!(pack:, document_type:)
        resolved = WorkflowTemplateLibrary.resolve(pack: pack, document_type: document_type)
        {
          key: resolved[:key],
          definition: resolved[:definition]
        }
      end
    end
  end
end
