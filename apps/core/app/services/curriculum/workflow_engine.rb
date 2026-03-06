module Curriculum
  class WorkflowEngine
    class TransitionError < StandardError; end

    class << self
      def transition!(record:, event:, actor:, context: {})
        pack = resolve_pack_for_record!(record)
        document_type = resolve_document_type(record)
        workflow_payload = Curriculum::WorkflowRegistry.workflow_for!(pack: pack, document_type: document_type)
        definition = workflow_payload[:definition]
        event_definition = stringify_keys((definition["events"] || {})[event.to_s] || {})
        raise TransitionError, "Unsupported transition #{document_type}.#{event}" if event_definition.empty?

        allowed_from = Array(event_definition["from"]).map(&:to_s)
        to_state = event_definition["to"].to_s
        roles = Array(event_definition["roles"]).map(&:to_s)
        current_state = record.status.to_s

        raise TransitionError, "Invalid from state" unless allowed_from.include?(current_state)
        raise TransitionError, "Role not permitted" unless role_allowed?(actor, roles)

        Curriculum::WorkflowGuards.check!(
          guards: event_definition["guards"],
          record: record,
          actor: actor,
          context: context
        )

        ActiveSupport::Notifications.instrument(
          "curriculum.workflow.transition",
          record_type: record.class.name,
          record_id: record.id,
          document_type: document_type,
          event: event.to_s,
          from_state: current_state,
          to_state: to_state,
          actor_id: actor&.id,
          tenant_id: record.respond_to?(:tenant_id) ? record.tenant_id : nil
        ) do
          record.update!(status: to_state)

          Curriculum::WorkflowSideEffects.apply!(
            effects: event_definition["side_effects"],
            record: record,
            actor: actor,
            context: context
          )
        end

        record
      rescue Curriculum::WorkflowRegistry::WorkflowError,
             Curriculum::WorkflowGuards::GuardFailed,
             Curriculum::WorkflowSideEffects::SideEffectError => e
        ActiveSupport::Notifications.instrument(
          "curriculum.workflow.transition_failed",
          record_type: record.class.name,
          record_id: record.id,
          document_type: document_type,
          event: event.to_s,
          actor_id: actor&.id,
          error: e.message
        )
        raise TransitionError, e.message
      end

      private

      def resolve_pack_for_record!(record)
        if record.respond_to?(:pack_key) && record.respond_to?(:pack_version) &&
           record.pack_key.present? && record.pack_version.present?
          pack = CurriculumPackStore.fetch(
            tenant: record.tenant,
            key: record.pack_key,
            version: record.pack_version
          )
          raise TransitionError, "Pack not found for #{record.pack_key}@#{record.pack_version}" if pack.nil?

          return pack
        end

        context = resolver_context_for(record)
        resolved = CurriculumProfileResolver.resolve(
          tenant: context[:tenant],
          school: context[:school],
          course: context[:course],
          academic_year: context[:academic_year]
        )
        pack = CurriculumPackStore.fetch(
          tenant: context[:tenant],
          key: resolved[:profile_key],
          version: resolved[:resolved_profile_version]
        )

        raise TransitionError, "Pack not found for resolved profile #{resolved[:profile_key]}" if pack.nil?

        pack
      end

      def resolver_context_for(record)
        case record
        when UnitPlan
          {
            tenant: record.tenant,
            school: record.course&.school,
            course: record.course,
            academic_year: record.course&.academic_year
          }
        when LessonPlan
          course = record.unit_plan&.course
          {
            tenant: record.tenant,
            school: course&.school,
            course: course,
            academic_year: course&.academic_year
          }
        when Template
          {
            tenant: record.tenant,
            school: nil,
            course: nil,
            academic_year: nil
          }
        else
          if record.respond_to?(:tenant)
            {
              tenant: record.tenant,
              school: record.try(:school),
              course: record.try(:course),
              academic_year: record.try(:academic_year)
            }
          else
            raise TransitionError, "Cannot resolve curriculum context for #{record.class.name}"
          end
        end
      end

      def resolve_document_type(record)
        return record.document_type.to_s if record.respond_to?(:document_type) && record.document_type.present?

        case record
        when UnitPlan
          "unit_plan"
        when LessonPlan
          "lesson_plan"
        when Template
          "template"
        else
          raise TransitionError, "Unknown workflow object #{record.class.name}"
        end
      end

      def role_allowed?(actor, roles)
        return false if actor.nil?
        return true if roles.empty?

        roles.any? { |role_name| actor.has_role?(role_name) }
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
