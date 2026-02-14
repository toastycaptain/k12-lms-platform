module Api
  module V1
    class LessonPlansController < ApplicationController
      before_action :set_unit_plan
      before_action :set_lesson_plan, only: [ :show, :update, :destroy, :create_version, :versions ]

      def index
        @lesson_plans = policy_scope(LessonPlan).where(unit_plan: @unit_plan).order(:position)
        render json: @lesson_plans
      end

      def show
        render json: @lesson_plan
      end

      def create
        @lesson_plan = LessonPlan.new(lesson_plan_params)
        @lesson_plan.unit_plan = @unit_plan
        @lesson_plan.created_by = Current.user
        authorize @lesson_plan

        if @lesson_plan.save
          @lesson_plan.create_version!(title: @lesson_plan.title)
          render json: @lesson_plan, status: :created
        else
          render json: { errors: @lesson_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @lesson_plan.update(lesson_plan_params.except(:unit_plan_id))
          render json: @lesson_plan
        else
          render json: { errors: @lesson_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @lesson_plan.destroy!
        head :no_content
      end

      def create_version
        authorize @lesson_plan
        version = @lesson_plan.create_version!(version_params)
        render json: version, status: :created
      end

      def versions
        authorize @lesson_plan, :show?
        render json: @lesson_plan.lesson_versions.order(version_number: :desc)
      end

      private

      def set_unit_plan
        @unit_plan = UnitPlan.find(params[:unit_plan_id])
      end

      def set_lesson_plan
        @lesson_plan = @unit_plan.lesson_plans.find(params[:id])
        authorize @lesson_plan unless %w[create_version versions].include?(action_name)
      end

      def lesson_plan_params
        params.require(:lesson_plan).permit(:title, :status, :position)
      end

      def version_params
        params.require(:version).permit(:title, :objectives, :activities, :materials, :duration_minutes)
      end
    end
  end
end
