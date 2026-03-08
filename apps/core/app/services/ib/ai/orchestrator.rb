module Ib
  module Ai
    class Orchestrator
      def initialize(user:)
        @user = user
      end

      def prepare(task_type:, prompt:, context:, template: nil)
        definition = TaskCatalog.fetch!(task_type)
        guardrail = GuardrailService.new(user: user, task_definition: definition)
        safe_context = guardrail.sanitize(context)
        messages = TemplateService.build_messages(
          task_type: task_type,
          definition: definition,
          prompt: prompt,
          context: safe_context,
          template: template
        )

        {
          definition: definition,
          messages: messages,
          context: safe_context.merge(
            "task_label" => definition[:label],
            "workflow" => definition[:workflow],
            "output_mode" => definition[:output_mode],
            "review_required" => definition[:review_required],
            "human_only_boundaries" => Array(definition[:human_only_boundaries]),
            "quality_track" => definition[:quality_track],
            "tenant_controls" => guardrail.tenant_controls,
            "guardrail_flags" => {
              "pii_redaction" => guardrail.tenant_controls["pii_redaction"],
              "grounding_required" => definition[:grounding_required]
            }
          )
        }
      end

      private

      attr_reader :user
    end
  end
end
