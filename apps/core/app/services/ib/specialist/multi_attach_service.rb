module Ib
  module Specialist
    class MultiAttachService
      def initialize(actor:)
        @actor = actor
      end

      def attach!(body:, target_document_ids:, comment_type: "support_note", metadata: {})
        documents = CurriculumDocument.where(id: target_document_ids, tenant_id: actor.tenant_id)
        batch_ref = "attach-#{SecureRandom.hex(6)}"
        comments = documents.map do |document|
          IbDocumentComment.create!(
            tenant: actor.tenant,
            curriculum_document: document,
            author: actor,
            comment_type: comment_type,
            visibility: "internal",
            body: body,
            metadata: metadata.to_h.merge(
              "attach_batch_ref" => batch_ref,
              "linked_targets" => target_document_ids,
              "independent" => false
            )
          )
        end
        {
          batch_ref: batch_ref,
          attached_count: comments.size,
          targets: comments.map { |comment| { id: comment.curriculum_document_id, entity_ref: Ib::RouteBuilder.entity_ref_for(comment.curriculum_document) } }
        }
      end
    end
  end
end
