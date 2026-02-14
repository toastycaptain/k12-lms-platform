module Api
  module V1
    class UnitVersionStandardsController < ApplicationController
      before_action :set_unit_version

      def index
        standards = policy_scope(Standard).where(id: @unit_version.standard_ids)
        render json: standards
      end

      def create
        authorize @unit_version.unit_plan, :update?
        standard_ids = Array(params[:standard_ids])
        standard_ids.each do |sid|
          @unit_version.unit_version_standards.find_or_create_by!(standard_id: sid) do |uvs|
            uvs.tenant = Current.tenant
          end
        end
        render json: @unit_version.standards.reload, status: :created
      end

      def destroy
        authorize @unit_version.unit_plan, :update?
        standard_ids = Array(params[:standard_ids])
        @unit_version.unit_version_standards.where(standard_id: standard_ids).destroy_all
        head :no_content
      end

      private

      def set_unit_version
        @unit_version = UnitVersion.find(params[:unit_version_id])
      end
    end
  end
end
