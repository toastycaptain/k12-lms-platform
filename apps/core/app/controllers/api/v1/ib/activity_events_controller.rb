module Api
  module V1
    module Ib
      class ActivityEventsController < BaseController
        skip_forgery_protection

        def index
          authorize IbActivityEvent
          events = policy_scope(IbActivityEvent).recent.limit((params[:limit] || 25).to_i.clamp(1, 100))
          events = events.where(event_family: params[:event_family]) if params[:event_family].present?
          events = events.where(surface: params[:surface]) if params[:surface].present?
          render json: events
        end

        def create
          authorize IbActivityEvent
          event = ::Ib::Support::ActivityEventService.record!(
            tenant: Current.tenant,
            user: Current.user,
            school: current_school_scope,
            event_name: activity_event_params.fetch(:event_name),
            event_family: activity_event_params[:event_family],
            surface: activity_event_params[:surface],
            programme: activity_event_params[:programme],
            route_id: activity_event_params[:route_id],
            entity_ref: activity_event_params[:entity_ref],
            document_type: activity_event_params[:document_type],
            session_key: activity_event_params[:session_key],
            metadata: activity_event_params[:metadata] || {},
            occurred_at: activity_event_params[:occurred_at] || Time.current,
            dedupe_key: activity_event_params[:dedupe_key]
          )
          render json: event, status: :created
        end

        private

        def activity_event_params
          params.require(:ib_activity_event).permit(
            :event_name,
            :event_family,
            :surface,
            :programme,
            :route_id,
            :entity_ref,
            :document_type,
            :session_key,
            :occurred_at,
            :dedupe_key,
            metadata: {}
          )
        end
      end
    end
  end
end
