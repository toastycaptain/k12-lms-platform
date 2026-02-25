module Api
  module V1
    class GradeCategoriesController < ApplicationController
      before_action :set_course
      before_action :set_grade_category, only: [ :update, :destroy ]

      def index
        authorize @course, :gradebook?

        categories = @course.grade_categories.order(:name)
        render json: categories
      end

      def create
        authorize @course, :gradebook?

        grade_category = @course.grade_categories.new(grade_category_params)
        grade_category.tenant = Current.tenant

        if grade_category.save
          render json: grade_category, status: :created
        else
          render json: { errors: grade_category.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @course, :gradebook?

        if @grade_category.update(grade_category_params)
          render json: @grade_category
        else
          render json: { errors: @grade_category.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @course, :gradebook?

        @grade_category.destroy!
        head :no_content
      end

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_grade_category
        @grade_category = @course.grade_categories.find(params[:id])
      end

      def grade_category_params
        params.permit(:name, :weight_percentage)
      end
    end
  end
end
