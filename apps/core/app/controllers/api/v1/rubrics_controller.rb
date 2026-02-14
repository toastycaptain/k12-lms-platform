module Api
  module V1
    class RubricsController < ApplicationController
      before_action :set_rubric, only: [ :show, :update, :destroy ]

      def index
        rubrics = policy_scope(Rubric).includes(rubric_criteria: :rubric_ratings)
        render json: rubrics
      end

      def show
        authorize @rubric
        render json: @rubric, include: [ "rubric_criteria", "rubric_criteria.rubric_ratings" ]
      end

      def create
        @rubric = Rubric.new(rubric_params)
        @rubric.tenant = Current.tenant
        @rubric.created_by = Current.user
        authorize @rubric
        if @rubric.save
          render json: @rubric, status: :created
        else
          render json: { errors: @rubric.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @rubric
        if @rubric.update(rubric_params)
          render json: @rubric
        else
          render json: { errors: @rubric.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @rubric
        @rubric.destroy!
        head :no_content
      end

      private

      def set_rubric
        @rubric = Rubric.includes(rubric_criteria: :rubric_ratings).find(params[:id])
      end

      def rubric_params
        params.permit(:title, :description, :points_possible)
      end
    end
  end
end
