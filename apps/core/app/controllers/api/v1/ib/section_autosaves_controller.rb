module Api
  module V1
    module Ib
      class SectionAutosavesController < BaseController
        def create
          document = policy_scope(CurriculumDocument).find(params.fetch(:curriculum_document_id))
          authorize document, :update?, policy_class: CurriculumDocumentPolicy
          result = ::Curriculum::SectionAutosaveService.new(
            document: document,
            actor: Current.user,
            content: autosave_params[:content] || {},
            title: autosave_params[:title],
            base_version_id: autosave_params[:base_version_id]
          ).save!
          if result.status == "conflict"
            ::Ib::Support::ActivityEventService.record!(
              tenant: Current.tenant,
              user: Current.user,
              school: current_school_scope,
              event_name: "ib.collaboration.conflict_detected",
              event_family: "collaboration",
              surface: "document_studio",
              entity_ref: "CurriculumDocument:#{document.id}",
              metadata: {
                curriculum_document_id: document.id,
                base_version_id: autosave_params[:base_version_id]
              }
            )
          end
          status = result.status == "conflict" ? :conflict : :ok
          render json: {
            status: result.status,
            conflict: result.conflict,
            curriculum_document_id: result.curriculum_document.id,
            current_version_id: result.curriculum_document.current_version_id,
            version_id: result.version&.id
          }, status: status
        end

        private

        def autosave_params
          params.require(:section_autosave).permit(:title, :base_version_id, content: {})
        end
      end
    end
  end
end
