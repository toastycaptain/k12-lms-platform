module Api
  module V1
    module Ib
      class ReportTemplatesController < BaseController
        before_action :set_template, only: :update

        def index
          authorize IbReportTemplate
          policy_scope(IbReportTemplate)
          render json: service.index_payload[:templates]
        end

        def create
          authorize IbReportTemplate
          render json: service.upsert_template!(template_params), status: :created
        end

        def update
          authorize @template
          render json: service.upsert_template!(template_params.merge(id: params[:id]))
        end

        private

        def set_template
          @template = policy_scope(IbReportTemplate).find(params[:id])
        end

        def service
          @service ||= ::Ib::Reporting::CycleService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def template_params
          params.fetch(:ib_report_template, params).permit(:programme, :audience, :family, :name, :status, :schema_version, section_definitions: {}, translation_rules: {}, metadata: {})
        end
      end
    end
  end
end
