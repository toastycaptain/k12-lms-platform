module Ib
  module Ai
    class TaskCatalog
      TASKS = {
        "ib_report_summary" => {
          label: "Report summary",
          workflow: "reporting",
          output_mode: "field_diff",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "reporting_quality",
          default_fields: [
            { "field" => "summary", "label" => "Report summary" }
          ],
          human_only_boundaries: %w[sign_off release deliver publish approve]
        },
        "ib_family_language" => {
          label: "Family language polish",
          workflow: "publishing",
          output_mode: "field_diff",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "family_language",
          default_fields: [
            { "field" => "summary", "label" => "Story summary" },
            { "field" => "support_prompt", "label" => "Support prompt" }
          ],
          human_only_boundaries: %w[publish release deliver approve]
        },
        "ib_reflection_summary" => {
          label: "Reflection summary",
          workflow: "reflection_review",
          output_mode: "field_diff",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "reflection_support",
          default_fields: [
            { "field" => "response_excerpt", "label" => "Response excerpt" }
          ],
          human_only_boundaries: %w[approve publish release]
        },
        "ib_evidence_gap" => {
          label: "Evidence gap scan",
          workflow: "reporting",
          output_mode: "analysis",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "coverage_risk",
          default_fields: [],
          human_only_boundaries: %w[sign_off release deliver publish approve]
        },
        "ib_inquiry_language" => {
          label: "Inquiry language suggestions",
          workflow: "document_studio",
          output_mode: "field_diff",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "planning_language",
          default_fields: [
            { "field" => "central_idea", "label" => "Central idea" },
            { "field" => "statement_of_inquiry", "label" => "Statement of inquiry" },
            { "field" => "lines_of_inquiry", "label" => "Lines of inquiry" },
            { "field" => "family_window_summary", "label" => "Family window summary" }
          ],
          human_only_boundaries: %w[publish approve release]
        },
        "ib_translation_support" => {
          label: "Translation support",
          workflow: "publishing",
          output_mode: "analysis",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "translation_quality",
          default_fields: [],
          human_only_boundaries: %w[publish release deliver approve]
        },
        "ib_proofing" => {
          label: "Proofing review",
          workflow: "publishing",
          output_mode: "analysis",
          default_roles: %w[teacher curriculum_lead admin],
          review_required: true,
          grounding_required: true,
          quality_track: "proofing_quality",
          default_fields: [],
          human_only_boundaries: %w[sign_off release deliver publish approve]
        }
      }.freeze

      class << self
        def tasks
          TASKS.deep_dup
        end

        def keys
          TASKS.keys
        end

        def ib_task?(task_type)
          TASKS.key?(task_type.to_s)
        end

        def definition_for(task_type)
          TASKS[task_type.to_s]&.deep_dup
        end

        def fetch!(task_type)
          definition_for(task_type) || raise(KeyError, "Unknown IB AI task: #{task_type}")
        end
      end
    end
  end
end
