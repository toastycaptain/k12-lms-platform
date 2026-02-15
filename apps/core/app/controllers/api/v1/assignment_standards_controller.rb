module Api
  module V1
    class AssignmentStandardsController < ApplicationController
      before_action :set_assignment

      def index
        standards = policy_scope(Standard).where(id: @assignment.standard_ids)
        render json: standards
      end

      def create
        authorize @assignment, :update?
        standard_ids = Array(params[:standard_ids])
        standard_ids.each do |sid|
          @assignment.assignment_standards.find_or_create_by!(standard_id: sid) do |as|
            as.tenant = Current.tenant
          end
        end
        render json: @assignment.standards.reload, status: :created
      end

      def destroy
        authorize @assignment, :update?
        standard_ids = Array(params[:standard_ids])
        @assignment.assignment_standards.where(standard_id: standard_ids).destroy_all
        head :no_content
      end

      private

      def set_assignment
        @assignment = Assignment.find(params[:assignment_id])
      end
    end
  end
end
