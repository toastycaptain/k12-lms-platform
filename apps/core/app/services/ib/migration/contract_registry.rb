module Ib
  module Migration
    class ContractRegistry
      DEFINITIONS = {
        "generic" => {
          "pyp_poi" => {
            required_fields: %w[title year_level theme],
            supported_fields: %w[title unit_title year_level year grade theme transdisciplinary_theme central_idea review_state status],
            aliases: {
              "unit_title" => "title",
              "year" => "year_level",
              "grade" => "year_level",
              "transdisciplinary_theme" => "theme"
            }
          },
          "curriculum_document" => {
            required_fields: %w[planning_context_name title],
            supported_fields: %w[planning_context_name context course_name title unit_title document_type type schema_key status content_json],
            aliases: {
              "context" => "planning_context_name",
              "course_name" => "planning_context_name",
              "unit_title" => "title",
              "type" => "document_type"
            }
          },
          "operational_record" => {
            required_fields: %w[title],
            supported_fields: %w[programme record_family family subtype type title summary next_action status priority risk_level route_hint],
            aliases: {
              "family" => "record_family",
              "type" => "subtype"
            }
          },
          "staff_role" => {
            required_fields: %w[user_email role_name],
            supported_fields: %w[school_name school programme academic_year_name academic_year user_email email role_name role],
            aliases: {
              "school" => "school_name",
              "academic_year" => "academic_year_name",
              "email" => "user_email",
              "role" => "role_name"
            }
          }
        },
        "toddle" => {
          "pyp_poi" => {
            required_fields: %w[title year_level theme],
            supported_fields: %w[unit_title grade_level transdisciplinary_theme central_idea review_state status teacher_notes],
            aliases: {
              "grade_level" => "year_level",
              "unit_title" => "title",
              "transdisciplinary_theme" => "theme"
            }
          },
          "curriculum_document" => {
            required_fields: %w[title planning_context_name],
            supported_fields: %w[course_name unit_title schema_key status content_json unit_stage unit_identifier],
            aliases: {
              "course_name" => "planning_context_name",
              "unit_title" => "title"
            }
          },
          "operational_record" => {
            required_fields: %w[title],
            supported_fields: %w[title family status priority risk_level next_action summary owner_email],
            aliases: {
              "family" => "record_family"
            }
          }
        },
        "managebac" => {
          "pyp_poi" => {
            required_fields: %w[title year_level theme],
            supported_fields: %w[title year_group transdisciplinary_theme central_idea state review_comment],
            aliases: {
              "year_group" => "year_level",
              "transdisciplinary_theme" => "theme",
              "state" => "review_state"
            }
          },
          "curriculum_document" => {
            required_fields: %w[title planning_context_name],
            supported_fields: %w[class_name title schema status document_kind content_json course_code],
            aliases: {
              "class_name" => "planning_context_name",
              "document_kind" => "document_type"
            }
          },
          "operational_record" => {
            required_fields: %w[title],
            supported_fields: %w[title record_family subtype status priority summary next_step route_hint candidate_ref],
            aliases: {
              "next_step" => "next_action"
            }
          },
          "staff_role" => {
            required_fields: %w[user_email role_name],
            supported_fields: %w[email role programme school_name academic_year_name],
            aliases: {
              "email" => "user_email",
              "role" => "role_name"
            }
          }
        }
      }.freeze

      class << self
        def definition_for(source_system:, source_kind:)
          system = source_system.to_s.presence || "generic"
          definitions = DEFINITIONS.fetch(system, DEFINITIONS.fetch("generic"))
          definitions.fetch(source_kind.to_s, fallback_definition)
        end

        def supported_systems
          DEFINITIONS.keys
        end

        private

        def fallback_definition
          {
            required_fields: [],
            supported_fields: [],
            aliases: {}
          }
        end
      end
    end
  end
end
