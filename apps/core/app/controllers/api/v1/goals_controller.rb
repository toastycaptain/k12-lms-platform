module Api
  module V1
    class GoalsController < ApplicationController
      before_action :set_goal, only: %i[show update destroy]

      def index
        goals = paginate(policy_scope(Goal).order(:target_date, :id))
        render json: goals
      end

      def show
        render json: @goal
      end

      def create
        @goal = Goal.new(goal_params)
        @goal.tenant = Current.tenant
        @goal.student = Current.user
        authorize @goal

        if @goal.save
          render json: @goal, status: :created
        else
          render json: { errors: @goal.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @goal.update(goal_params)
          render json: @goal
        else
          render json: { errors: @goal.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @goal.destroy!
        head :no_content
      end

      private

      def set_goal
        @goal = Goal.find(params[:id])
        authorize @goal
      end

      def goal_params
        params.permit(:title, :description, :status, :target_date, :progress_percent)
      end
    end
  end
end
