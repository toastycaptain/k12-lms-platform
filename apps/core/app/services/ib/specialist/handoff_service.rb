module Ib
  module Specialist
    class HandoffService
      def initialize(actor:, collaborator:)
        @actor = actor
        @collaborator = collaborator
      end

      def transition!(state:, note: nil)
        collaborator.metadata = collaborator.metadata.merge(
          "handoff_state" => state,
          "handoff_note" => note,
          "handoff_updated_at" => Time.current.utc.iso8601,
          "handoff_updated_by_id" => actor.id
        )
        collaborator.save!
        NotificationService.notify(
          user: collaborator.curriculum_document.created_by,
          event_type: "ib_specialist_handoff",
          title: "Specialist handoff updated",
          message: "#{collaborator.curriculum_document.title} is now #{state.tr('_', ' ')}.",
          url: Ib::RouteBuilder.href_for(collaborator.curriculum_document),
          actor: actor,
          metadata: { "handoff_state" => state, "document_id" => collaborator.curriculum_document_id },
          dedupe_key: "specialist-handoff:#{collaborator.id}:#{state}"
        )
        collaborator
      end

      private

      attr_reader :actor, :collaborator
    end
  end
end
