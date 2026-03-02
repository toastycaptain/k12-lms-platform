module Api
  module V1
    class SchoolsController < ApplicationController
      before_action :set_school, only: [ :show, :update, :destroy ]

      def index
        authorize School
        render json: policy_scope(School).order(:name)
      end

      def show
        authorize @school
        render json: @school
      end

      def create
        @school = School.new(school_params)
        @school.tenant = Current.tenant
        authorize @school

        if @school.save
          render json: @school, status: :created
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @school
        if @school.update(school_params)
          render json: @school
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @school
        @school.destroy!
        head :no_content
      end

      private

      def set_school
        @school = School.find(params[:id])
      end

      def school_params
        params.require(:school).permit(:name, :address, :timezone, :curriculum_profile_key)
      end
    end
  end
end
