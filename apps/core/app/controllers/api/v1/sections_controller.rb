module Api
  module V1
    class SectionsController < ApplicationController
      before_action :set_section, only: [ :show, :update, :destroy ]

      def index
        @sections = policy_scope(Section)
        @sections = @sections.where(course_id: params[:course_id]) if params[:course_id]
        render json: @sections
      end

      def show
        render json: @section
      end

      def create
        @section = Section.new(section_params)
        authorize @section

        if @section.save
          render json: @section, status: :created
        else
          render json: { errors: @section.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @section.update(section_params)
          render json: @section
        else
          render json: { errors: @section.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @section.destroy!
        head :no_content
      end

      private

      def set_section
        @section = Section.find(params[:id])
        authorize @section
      end

      def section_params
        params.require(:section).permit(:course_id, :term_id, :name)
      end
    end
  end
end
