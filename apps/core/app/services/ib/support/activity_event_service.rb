require "digest"

module Ib
  module Support
    class ActivityEventService
      SENSITIVE_KEYS = %w[
        body
        content
        raw_payload
        response_excerpt
        story_draft
        translated_summary
        translated_support_prompt
        message
      ].freeze

      class << self
        def record!(tenant:, user: nil, school: nil, event_name:, event_family: nil, surface: nil,
                    programme: nil, route_id: nil, entity_ref: nil, document_type: nil,
                    session_key: nil, metadata: {}, occurred_at: Time.current, dedupe_key: nil)
          normalized_metadata = sanitize_value(metadata)
          resolved_family = event_family.presence || infer_family(event_name)
          resolved_surface = surface.presence || infer_surface(event_name, resolved_family)
          resolved_programme = normalize_programme(programme)
          resolved_dedupe_key = dedupe_key.presence

          if resolved_dedupe_key.present?
            existing = IbActivityEvent.find_by(tenant_id: tenant.id, dedupe_key: resolved_dedupe_key)
            return existing if existing
          end

          IbActivityEvent.create!(
            tenant: tenant,
            user: user,
            school: school,
            event_name: event_name,
            event_family: resolved_family,
            surface: resolved_surface,
            programme: resolved_programme,
            route_id: route_id,
            entity_ref: entity_ref,
            document_type: document_type,
            session_key: session_key,
            dedupe_key: resolved_dedupe_key,
            metadata: normalized_metadata,
            occurred_at: occurred_at
          )
        rescue StandardError => e
          Rails.logger.warn("ib.activity_event.record_failed #{e.class}: #{e.message}")
          nil
        end

        def workflow_dedupe_key(event_name:, user:, entity_ref:, metadata: {})
          base = [ event_name, user&.id, entity_ref, metadata[:workflow_key], metadata[:route_id], metadata[:surface] ].compact.join(":")
          Digest::SHA256.hexdigest(base)[0, 24]
        end

        def sanitize_value(value)
          case value
          when Hash
            value.each_with_object({}) do |(key, entry), memo|
              next if SENSITIVE_KEYS.include?(key.to_s)

              memo[key.to_s] = sanitize_value(entry)
            end
          when Array
            value.first(25).map { |entry| sanitize_value(entry) }
          when String
            value.length > 280 ? "#{value[0, 277]}..." : value
          when Numeric, TrueClass, FalseClass, NilClass
            value
          else
            value.to_s
          end
        end

        def infer_family(event_name)
          value = event_name.to_s
          return "teacher_workflow" if value.include?("teacher") || value.include?("studio")
          return "specialist_workflow" if value.include?("specialist")
          return "coordinator_intelligence" if value.include?("coordinator") || value.include?("operations")
          return "student_journey" if value.include?("student") || value.include?("reflection") || value.include?("portfolio")
          return "family_experience" if value.include?("guardian") || value.include?("family") || value.include?("publishing")
          return "search_and_navigation" if value.include?("search") || value.include?("route") || value.include?("command")
          return "performance" if value.include?("performance") || value.include?("render") || value.include?("latency")

          "ib_workflow"
        end

        def infer_surface(event_name, event_family)
          return "teacher_home" if event_name.to_s.include?("home")
          return "search" if event_name.to_s.include?("search") || event_name.to_s.include?("command")

          case event_family
          when "teacher_workflow" then "teacher_studio"
          when "specialist_workflow" then "specialist_dashboard"
          when "coordinator_intelligence" then "operations_center"
          when "student_journey" then "student_home"
          when "family_experience" then "family_home"
          when "performance" then "performance"
          else
            "ib_workspace"
          end
        end

        def normalize_programme(programme)
          return "PYP" if programme == "PYP"
          return "MYP" if programme == "MYP"
          return "DP" if programme == "DP"

          "Mixed"
        end
      end
    end
  end
end
