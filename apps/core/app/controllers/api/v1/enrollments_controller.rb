module Api
  module V1
    class EnrollmentsController < ApplicationController
      before_action :set_enrollment, only: [ :show, :update, :destroy ]

      def index
        @enrollments = policy_scope(Enrollment)
        @enrollments = @enrollments.where(section_id: params[:section_id]) if params[:section_id]
        render json: @enrollments
      end

      def show
        render json: @enrollment
      end

      def create
        @enrollment = Enrollment.new(enrollment_params)
        @enrollment.user_id = params.require(:enrollment)[:user_id]
        authorize @enrollment

        if @enrollment.save
          render json: @enrollment, status: :created
        else
          render json: { errors: @enrollment.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @enrollment.update(enrollment_params)
          render json: @enrollment
        else
          render json: { errors: @enrollment.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @enrollment.destroy!
        head :no_content
      end

      private

      def set_enrollment
        @enrollment = Enrollment.find(params[:id])
        authorize @enrollment
      end

      def enrollment_params
        params.require(:enrollment).permit(:section_id, :role)
      end
    end
  end
end
