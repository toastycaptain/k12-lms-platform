module Api
  module V1
    module Ib
      class MigrationMappingTemplatesController < BaseController
        before_action :set_template, only: :update

        def index
          authorize IbMigrationMappingTemplate
          policy_scope(IbMigrationMappingTemplate)
          render json: service.index_payload[:mapping_templates]
        end

        def create
          authorize IbMigrationMappingTemplate
          render json: service.upsert_template!(template_params), status: :created
        end

        def update
          authorize @template
          render json: service.upsert_template!(template_params.merge(id: params[:id]))
        end

        private

        def set_template
          @template = policy_scope(IbMigrationMappingTemplate).find(params[:id])
        end

        def service
          @service ||= ::Ib::Migration::SessionService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def template_params
          params.fetch(:ib_migration_mapping_template, params).permit(:source_system, :programme, :name, :status, :shared, field_mappings: {}, transform_library: {}, role_mapping_rules: {}, metadata: {})
        end
      end
    end
  end
end
