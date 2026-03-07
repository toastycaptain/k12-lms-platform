module Api
  module V1
    module Ib
      class PilotFeedbackItemsController < BaseController
        before_action :set_feedback_item, only: :update

        def index
          authorize IbPilotFeedbackItem
          items = policy_scope(IbPilotFeedbackItem).order(updated_at: :desc, id: :desc)
          render json: items.map { |item| serialize(item) }
        end

        def create
          authorize IbPilotFeedbackItem
          render json: service.create_feedback!(feedback_params), status: :created
        end

        def update
          authorize @feedback_item
          render json: service.update_feedback!(@feedback_item, feedback_params)
        end

        private

        def service
          @service ||= ::Ib::Pilot::SupportConsoleService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def set_feedback_item
          @feedback_item = policy_scope(IbPilotFeedbackItem).find(params[:id])
        end

        def feedback_params
          params.fetch(:ib_pilot_feedback_item, params).permit(:ib_pilot_profile_id, :title, :detail, :surface, :category, :role_scope, :sentiment, :status, tags: [], routing_payload: {}, metadata: {})
        end

        def serialize(item)
          {
            id: item.id,
            title: item.title,
            detail: item.detail,
            status: item.status,
            sentiment: item.sentiment,
            category: item.category,
            role_scope: item.role_scope,
            surface: item.surface,
            tags: item.tags,
            routing_payload: item.routing_payload,
            updated_at: item.updated_at.utc.iso8601
          }
        end
      end
    end
  end
end
