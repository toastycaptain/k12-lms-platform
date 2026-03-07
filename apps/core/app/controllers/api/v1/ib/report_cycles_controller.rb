module Api
  module V1
    module Ib
      class ReportCyclesController < BaseController
        before_action :set_cycle, only: :update

        def index
          authorize IbReportCycle
          policy_scope(IbReportCycle)
          render json: service.index_payload
        end

        def create
          authorize IbReportCycle
          render json: service.upsert_cycle!(cycle_params), status: :created
        end

        def update
          authorize @cycle
          render json: service.upsert_cycle!(cycle_params.merge(id: params[:id]))
        end

        private

        def set_cycle
          @cycle = policy_scope(IbReportCycle).find(params[:id])
        end

        def service
          @service ||= ::Ib::Reporting::CycleService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def cycle_params
          params.fetch(:ib_report_cycle, params).permit(:programme, :cycle_key, :status, :starts_on, :ends_on, :due_on, delivery_window: {}, localization_settings: {}, approval_summary: {}, metadata: {})
        end
      end
    end
  end
end
