module Api
  module V1
    class RubricCriteriaController < ApplicationController
      before_action :set_rubric, only: [ :index, :create ]
      before_action :set_criterion, only: [ :update, :destroy ]

      def index
        criteria = policy_scope(RubricCriterion).where(rubric: @rubric).ordered
        render json: criteria
      end

      def create
        @criterion = @rubric.rubric_criteria.build(criterion_params)
        @criterion.tenant = Current.tenant
        authorize @criterion
        if @criterion.save
          render json: @criterion, status: :created
        else
          render json: { errors: @criterion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @criterion
        if @criterion.update(criterion_params)
          render json: @criterion
        else
          render json: { errors: @criterion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @criterion
        @criterion.destroy!
        head :no_content
      end

      private

      def set_rubric
        @rubric = Rubric.find(params[:rubric_id])
      end

      def set_criterion
        @criterion = RubricCriterion.find(params[:id])
      end

      def criterion_params
        params.permit(:title, :description, :points, :position)
      end
    end
  end
end
