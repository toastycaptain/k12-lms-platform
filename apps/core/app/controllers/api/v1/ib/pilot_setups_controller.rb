module Api
  module V1
    module Ib
      class PilotSetupsController < BaseController
        before_action :authorize_setup

        def show
          render json: mutation_service.show
        end

        def update
          payload = mutation_service.upsert!(pilot_setup_params)
          audit_event("ib.pilot_setup.updated", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme], status: payload[:status] })
          render json: payload, status: :ok
        end

        def apply_baseline
          payload = mutation_service.apply_baseline!
          audit_event("ib.pilot_setup.baseline_applied", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme] })
          render json: payload, status: :ok
        end

        def validate_setup
          payload = mutation_service.validate!
          audit_event("ib.pilot_setup.validated", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme], computed_status: payload[:computed_status] })
          render json: payload, status: :ok
        end

        def activate
          payload = mutation_service.activate!
          audit_event("ib.pilot_setup.activated", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme] })
          render json: payload, status: :ok
        end

        def pause
          payload = mutation_service.pause!(reason: params[:reason])
          audit_event("ib.pilot_setup.paused", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme], reason: params[:reason] })
          render json: payload, status: :ok
        end

        def resume
          payload = mutation_service.resume!
          audit_event("ib.pilot_setup.resumed", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme] })
          render json: payload, status: :ok
        end

        def retire
          payload = mutation_service.retire!
          audit_event("ib.pilot_setup.retired", auditable: mutation_service.setup_record, metadata: { programme: payload[:programme] })
          render json: payload, status: :ok
        end

        private

        def authorize_setup
          authorize IbPilotSetup
        end

        def mutation_service
          @mutation_service ||= ::Ib::Support::PilotSetupMutationService.new(
            tenant: Current.tenant,
            school: current_school_scope || School.where(tenant_id: Current.tenant.id).first!,
            actor: Current.user,
            programme: params[:programme].presence || pilot_setup_params[:programme].presence || "Mixed",
          )
        end

        def pilot_setup_params
          params.fetch(:pilot_setup, {}).permit(:programme, feature_flag_bundle: {}, owner_assignments: {}, status_details: {})
        end
      end
    end
  end
end
