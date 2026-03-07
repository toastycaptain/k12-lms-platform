module Api
  module V1
    module Ib
      class IntelligenceMetricDefinitionsController < BaseController
        before_action :set_definition, only: :update

        def index
          authorize IbIntelligenceMetricDefinition
          policy_scope(IbIntelligenceMetricDefinition)
          render json: service.index_payload
        end

        def create
          authorize IbIntelligenceMetricDefinition
          render json: service.upsert_definition!(definition_params), status: :created
        end

        def update
          authorize @definition
          render json: service.upsert_definition!(definition_params.merge(id: params[:id]))
        end

        private

        def set_definition
          @definition = policy_scope(IbIntelligenceMetricDefinition).find(params[:id])
        end

        def service
          @service ||= ::Ib::Intelligence::SemanticLayerService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def definition_params
          params.fetch(:ib_intelligence_metric_definition, params).permit(:key, :status, :metric_family, :label, :definition, :version, source_of_truth: {}, threshold_config: {}, metadata: {})
        end
      end
    end
  end
end
