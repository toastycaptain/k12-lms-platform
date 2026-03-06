module Api
  module V1
    module Ib
      class StandardsCyclesController < BaseController
        before_action :set_cycle, only: [ :show, :update ]

        def index
          authorize IbStandardsCycle
          cycles = policy_scope(IbStandardsCycle).includes(packets: :items).order(updated_at: :desc)
          render json: cycles
        end

        def show
          authorize @cycle
          render json: @cycle
        end

        def create
          authorize IbStandardsCycle
          cycle = IbStandardsCycle.create!(cycle_params.merge(
            tenant: Current.tenant,
            school_id: current_school_scope&.id || cycle_params.fetch(:school_id)
          ))
          render json: cycle, status: :created
        end

        def update
          authorize @cycle
          @cycle.update!(cycle_params)
          render json: @cycle
        end

        private

        def set_cycle
          @cycle = policy_scope(IbStandardsCycle).find(params[:id])
        end

        def cycle_params
          params.require(:ib_standards_cycle).permit(:school_id, :academic_year_id, :coordinator_id, :title, :status, metadata: {})
        end
      end
    end
  end
end
