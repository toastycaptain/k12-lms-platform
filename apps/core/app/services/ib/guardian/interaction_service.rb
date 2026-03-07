module Ib
  module Guardian
    class InteractionService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def summary
        scope = IbActivityEvent.where(tenant_id: user.tenant_id, event_family: "family_experience")
        scope = scope.where(school_id: school.id) if school
        responses = scope.where(event_name: "ib.guardian.response.shared").recent.limit(8)
        acknowledgements = scope.where(event_name: "ib.guardian.story.acknowledged").recent.limit(8)
        {
          acknowledgements: acknowledgements.map { |event| event_payload(event) },
          responses: responses.map { |event| event_payload(event) }
        }
      end

      def record_response!(entity_ref:, body: nil)
        Ib::Support::ActivityEventService.record!(
          tenant: user.tenant,
          user: user,
          school: school,
          event_name: body.present? ? "ib.guardian.response.shared" : "ib.guardian.story.acknowledged",
          event_family: "family_experience",
          surface: "family_home",
          entity_ref: entity_ref,
          metadata: { title: entity_ref, detail: body.presence || "Acknowledged" },
          dedupe_key: body.present? ? nil : "guardian-ack:#{user.id}:#{entity_ref}"
        )
      end

      private

      attr_reader :user, :school

      def event_payload(event)
        {
          id: event.id,
          title: event.metadata["title"].presence || event.entity_ref,
          detail: event.metadata["detail"].presence || event.event_name.humanize,
          occurred_at: event.occurred_at.iso8601
        }
      end
    end
  end
end
