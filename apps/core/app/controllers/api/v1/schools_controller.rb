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
          CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
          render json: @school, status: :created
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @school
        if @school.update(school_params)
          CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
          render json: @school
        else
          render json: { errors: @school.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @school
        @school.destroy!
        CurriculumProfileResolver.invalidate_cache!(tenant: Current.tenant)
        head :no_content
      end

      private

      def set_school
        @school = School.find(params[:id])
      end

      def school_params
        permitted = [ :name, :address, :timezone ]
        if Current.user&.has_role?(:admin)
          permitted << :curriculum_profile_key
          permitted << :curriculum_profile_version
        end

        params.require(:school).permit(*permitted)
      end
    end
  end
end
