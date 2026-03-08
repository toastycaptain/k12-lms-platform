module Api
  module V1
    module Ib
      class EvidenceItemsController < BaseController
        before_action :set_evidence_item, only: [ :show, :update, :validate_item, :request_reflection, :set_visibility, :link_story ]

        def index
          authorize IbEvidenceItem
          items = filtered_items
          render json: items
        end

        def summary
          authorize IbEvidenceItem
          render json: ::Ib::Evidence::InboxSummaryService.new(
            user: Current.user,
            school: current_school_scope
          ).build(scope: filtered_items)
        end

        def show
          authorize @evidence_item
          render json: @evidence_item
        end

        def create
          authorize IbEvidenceItem
          item = IbEvidenceItem.create!(evidence_item_attributes.merge(
            tenant: Current.tenant,
            school_id: current_school_scope&.id || evidence_item_attributes.fetch(:school_id),
            created_by: Current.user
          ))
          item.attachments.attach(evidence_item_params[:attachments]) if evidence_item_params[:attachments].present?
          render json: item, status: :created
        end

        def update
          authorize @evidence_item
          @evidence_item.update!(evidence_item_attributes)
          @evidence_item.attachments.attach(evidence_item_params[:attachments]) if evidence_item_params[:attachments].present?
          render json: @evidence_item
        end

        def validate_item
          authorize @evidence_item
          @evidence_item.update!(status: "validated")
          render json: @evidence_item
        end

        def request_reflection
          authorize @evidence_item
          request = @evidence_item.reflection_requests.create!(
            tenant: Current.tenant,
            requested_by: Current.user,
            student_id: params.require(:reflection_request).fetch(:student_id),
            prompt: params.require(:reflection_request).fetch(:prompt),
            due_on: params[:reflection_request][:due_on]
          )
          @evidence_item.update!(status: "reflection_requested")
          render json: request, serializer: IbReflectionRequestSerializer, status: :created
        end

        def set_visibility
          authorize @evidence_item
          @evidence_item.update!(visibility: params.require(:visibility).to_s)
          render json: @evidence_item
        end

        def link_story
          authorize @evidence_item
          story = policy_scope(IbLearningStory).find(params.require(:ib_learning_story_id))
          IbLearningStoryEvidenceItem.find_or_create_by!(tenant: Current.tenant, ib_learning_story: story, ib_evidence_item: @evidence_item)
          @evidence_item.update!(status: "linked_to_story")
          render json: @evidence_item
        end

        private

        def set_evidence_item
          @evidence_item = policy_scope(IbEvidenceItem).with_attached_attachments.find(params[:id])
        end

        def evidence_item_params
          params.require(:ib_evidence_item).permit(
            :school_id,
            :planning_context_id,
            :curriculum_document_id,
            :curriculum_document_version_id,
            :ib_operational_record_id,
            :student_id,
            :programme,
            :status,
            :visibility,
            :contributor_type,
            :title,
            :summary,
            :next_action,
            :story_draft,
            attachments: [],
            metadata: {}
          )
        end

        def evidence_item_attributes
          evidence_item_params.except(:attachments)
        end

        def filtered_items
          items = policy_scope(IbEvidenceItem).with_attached_attachments.includes(:story_links).order(updated_at: :desc)
          items = items.where(programme: params[:programme]) if params[:programme].present?
          items = items.where(status: params[:status]) if params[:status].present?
          items = items.where(visibility: params[:visibility]) if params[:visibility].present?
          items = items.where(curriculum_document_id: params[:curriculum_document_id]) if params[:curriculum_document_id].present?
          items = items.where(planning_context_id: params[:planning_context_id]) if params[:planning_context_id].present?
          items = items.where(student_id: params[:student_id]) if params[:student_id].present?
          items = items.where(created_by_id: params[:created_by_id]) if params[:created_by_id].present?
          items = items.where("title ILIKE :q OR summary ILIKE :q", q: "%#{params[:q].to_s.strip}%") if params[:q].present?
          items = items.left_joins(:story_links).where(ib_learning_story_evidence_items: { id: nil }) if truthy_param?(params[:unlinked])
          items = items.where("updated_at >= ?", Time.zone.parse(params[:changed_since])) if params[:changed_since].present?
          items
        end

        def truthy_param?(value)
          %w[1 true yes on].include?(value.to_s.strip.downcase)
        end
      end
    end
  end
end
