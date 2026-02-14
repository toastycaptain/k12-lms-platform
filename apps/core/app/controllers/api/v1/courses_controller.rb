module Api
  module V1
    class CoursesController < ApplicationController
      before_action :set_course, only: [ :show, :update, :destroy ]

      def index
        @courses = paginate(policy_scope(Course).includes(:sections))
        render json: @courses
      end

      def show
        render json: @course
      end

      def create
        @course = Course.new(course_params)
        authorize @course

        if @course.save
          render json: @course, status: :created
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @course.update(course_params)
          render json: @course
        else
          render json: { errors: @course.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @course.destroy!
        head :no_content
      end

      private

      def set_course
        @course = Course.includes(:sections).find(params[:id])
        authorize @course
      end

      def course_params
        params.require(:course).permit(:academic_year_id, :name, :code, :description)
      end
    end
  end
end
