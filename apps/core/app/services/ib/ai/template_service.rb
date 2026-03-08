module Ib
  module Ai
    class TemplateService
      class << self
        def build_messages(task_type:, definition:, prompt:, context:, template: nil)
          [
            { role: "system", content: template&.system_prompt.presence || system_prompt(definition: definition) },
            { role: "user", content: user_prompt(task_type: task_type, definition: definition, prompt: prompt, context: context) }
          ]
        end

        private

        def system_prompt(definition:)
          <<~PROMPT.strip
            You are assisting inside a K-12 IB planning platform.
            Stay grounded in the supplied source material.
            Do not invent student facts, assessment claims, approvals, or publication decisions.
            Every output must remain reviewable by a human educator before it is applied.
            Respect these human-only boundaries: #{Array(definition[:human_only_boundaries]).join(", ")}.
          PROMPT
        end

        def user_prompt(task_type:, definition:, prompt:, context:)
          instruction = prompt.to_s.strip
          source_block = grounding_block(context)
          glossary_block = glossary_block_for(context)
          current_values = context.fetch("current_values", {})
          target_fields = Array(context["target_fields"]).presence || Array(definition[:default_fields])

          case task_type.to_s
          when "ib_report_summary"
            <<~PROMPT.strip
              Task: draft a grounded report summary for #{context["audience"].presence || "the current audience"}.
              #{source_block}
              Current summary:
              #{current_values["summary"].presence || "(blank)"}

              #{instruction_block(instruction)}
              Return JSON with a `fields` array containing one suggestion for `summary`.
            PROMPT
          when "ib_family_language"
            <<~PROMPT.strip
              Task: rewrite this family-facing learning story into clearer, calmer language.
              #{source_block}
              Current fields:
              #{formatted_current_values(current_values, target_fields)}

              #{instruction_block(instruction)}
              Return JSON with a `fields` array for `summary` and `support_prompt`.
            PROMPT
          when "ib_reflection_summary"
            <<~PROMPT.strip
              Task: summarize the student's reflection for teacher review.
              Reflection prompt: #{context["reflection_prompt"].presence || "(not provided)"}
              #{source_block}

              #{instruction_block(instruction)}
              Return JSON with a `fields` array containing `response_excerpt`.
            PROMPT
          when "ib_evidence_gap"
            <<~PROMPT.strip
              Task: identify grounded evidence gaps or unsupported claims.
              #{source_block}

              #{instruction_block(instruction)}
              Return concise markdown with headings:
              - Grounded strengths
              - Evidence gaps
              - Teacher follow-up
            PROMPT
          when "ib_inquiry_language"
            <<~PROMPT.strip
              Task: strengthen inquiry language for the current unit draft.
              Programme: #{context["programme"].presence || "IB"}
              Document: #{context["document_title"].presence || "Current unit"}
              #{source_block}
              Current fields:
              #{formatted_current_values(current_values, target_fields)}

              #{instruction_block(instruction)}
              Return JSON with a `fields` array for the requested inquiry fields.
            PROMPT
          when "ib_translation_support"
            <<~PROMPT.strip
              Task: produce a teacher-review translation aid in #{context["locale"].presence || "the target locale"}.
              #{source_block}
              #{glossary_block}

              #{instruction_block(instruction)}
              Return markdown with:
              - Suggested translation
              - Glossary decisions
              - Human review checks
            PROMPT
          when "ib_proofing"
            <<~PROMPT.strip
              Task: proof this publishable content for clarity, tone, and missing context.
              #{source_block}

              #{instruction_block(instruction)}
              Return markdown with:
              - Clarity risks
              - Tone risks
              - Missing context
              - Recommended teacher edits
            PROMPT
          else
            [ instruction, source_block ].reject(&:blank?).join("\n\n")
          end
        end

        def grounding_block(context)
          refs = Array(context["grounding_refs"])
          source_text = context["source_text"].presence
          parts = []

          if refs.present?
            parts << "Grounding references:"
            refs.each do |ref|
              parts << "- #{ref["label"].presence || ref["type"].presence || "Source"}: #{ref["excerpt"]}"
            end
          end

          parts << "Primary source text:\n#{source_text}" if source_text.present?
          parts.presence&.join("\n") || "No source text was provided."
        end

        def glossary_block_for(context)
          glossary = Array(context["glossary_terms"])
          return "" if glossary.empty?

          "Glossary:\n" + glossary.map { |term| "- #{term["term"]}: #{term["preferred"]}" }.join("\n")
        end

        def instruction_block(instruction)
          return "No extra teacher instruction was provided." if instruction.blank?

          "Teacher instruction:\n#{instruction}"
        end

        def formatted_current_values(current_values, target_fields)
          Array(target_fields).map do |field|
            key = field["field"].to_s
            label = field["label"].presence || key
            "#{label}: #{current_values[key].presence || "(blank)"}"
          end.join("\n")
        end
      end
    end
  end
end
