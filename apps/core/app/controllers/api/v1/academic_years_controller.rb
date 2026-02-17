module Api
  module V1
    class AcademicYearsController < ApplicationController
      before_action :set_academic_year, only: [ :show, :update, :destroy ]

      def index
        @academic_years = policy_scope(AcademicYear).includes(:terms)
        render json: @academic_years
      end

      def show
        render json: @academic_year
      end

      def create
        @academic_year = AcademicYear.new(academic_year_params)
        authorize @academic_year

        if @academic_year.save
          render json: @academic_year, status: :created
        else
          render json: { errors: @academic_year.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @academic_year.update(academic_year_params)
          render json: @academic_year
        else
          render json: { errors: @academic_year.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @academic_year.destroy!
        head :no_content
      end

      private

      def set_academic_year
        @academic_year = AcademicYear.includes(:terms).find(params[:id])
        authorize @academic_year
      end

      def academic_year_params
        params.require(:academic_year).permit(:name, :start_date, :end_date, :current)
      end
    end
  end
end
