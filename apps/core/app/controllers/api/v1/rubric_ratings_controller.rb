module Api
  module V1
    class RubricRatingsController < ApplicationController
      before_action :set_criterion, only: [ :index, :create ]
      before_action :set_rating, only: [ :update, :destroy ]

      def index
        ratings = policy_scope(RubricRating).where(rubric_criterion: @criterion).ordered
        render json: ratings
      end

      def create
        @rating = @criterion.rubric_ratings.build(rating_params)
        @rating.tenant = Current.tenant
        authorize @rating
        if @rating.save
          render json: @rating, status: :created
        else
          render json: { errors: @rating.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @rating
        if @rating.update(rating_params)
          render json: @rating
        else
          render json: { errors: @rating.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @rating
        @rating.destroy!
        head :no_content
      end

      private

      def set_criterion
        @criterion = RubricCriterion.find(params[:rubric_criterion_id])
      end

      def set_rating
        @rating = RubricRating.find(params[:id])
      end

      def rating_params
        params.permit(:description, :points, :position)
      end
    end
  end
end
