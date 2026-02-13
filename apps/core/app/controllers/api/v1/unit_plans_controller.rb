module Api
  module V1
    class UnitPlansController < ApplicationController
      before_action :set_unit_plan, only: [ :show, :update, :destroy, :create_version, :versions ]

      def index
        @unit_plans = policy_scope(UnitPlan)
        @unit_plans = @unit_plans.where(course_id: params[:course_id]) if params[:course_id]
        render json: @unit_plans
      end

      def show
        render json: @unit_plan
      end

      def create
        @unit_plan = UnitPlan.new(unit_plan_params)
        @unit_plan.created_by = Current.user
        authorize @unit_plan

        if @unit_plan.save
          @unit_plan.create_version!(title: @unit_plan.title)
          render json: @unit_plan, status: :created
        else
          render json: { errors: @unit_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @unit_plan.update(unit_plan_params.except(:course_id))
          render json: @unit_plan
        else
          render json: { errors: @unit_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @unit_plan.destroy!
        head :no_content
      end

      def create_version
        authorize @unit_plan

        version = @unit_plan.create_version!(version_params)
        render json: version, status: :created
      end

      def versions
        authorize @unit_plan, :show?
        render json: @unit_plan.unit_versions.order(version_number: :desc)
      end

      private

      def set_unit_plan
        @unit_plan = UnitPlan.find(params[:id])
        authorize @unit_plan unless %w[create_version versions].include?(action_name)
      end

      def unit_plan_params
        params.require(:unit_plan).permit(:course_id, :title, :status)
      end

      def version_params
        params.require(:version).permit(:title, :description, essential_questions: [], enduring_understandings: [])
      end
    end
  end
end
