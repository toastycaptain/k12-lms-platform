module Api
  module V1
    module Ib
      class CollaborationEventsController < BaseController
        def index
          authorize IbCollaborationEvent
          events = policy_scope(IbCollaborationEvent).order(occurred_at: :desc, id: :desc)
          events = events.where(curriculum_document_id: params[:curriculum_document_id]) if params[:curriculum_document_id].present?
          render json: events.limit(25).map { |event| serialize(event) }
        end

        def create
          authorize IbCollaborationEvent
          render json: service.record_event!(event_params), status: :created
        end

        private

        def service
          @service ||= ::Ib::Collaboration::WorkbenchService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def event_params
          params.fetch(:ib_collaboration_event, params).permit(:curriculum_document_id, :ib_collaboration_session_id, :event_name, :route_id, :scope_key, :section_key, :durable, payload: {})
        end

        def serialize(event)
          {
            id: event.id,
            event_name: event.event_name,
            route_id: event.route_id,
            scope_key: event.scope_key,
            section_key: event.section_key,
            durable: event.durable,
            payload: event.payload,
            occurred_at: event.occurred_at.utc.iso8601
          }
        end
      end
    end
  end
end
