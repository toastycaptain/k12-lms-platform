module Api
  module V1
    class ResourceLinksController < ApplicationController
      before_action :set_linkable
      before_action :set_resource_link, only: [ :destroy ]

      def index
        @resource_links = policy_scope(ResourceLink).where(linkable: @linkable)
        render json: @resource_links
      end

      def create
        @resource_link = ResourceLink.new(resource_link_params)
        @resource_link.linkable = @linkable
        authorize @resource_link

        if @resource_link.save
          render json: @resource_link, status: :created
        else
          render json: { errors: @resource_link.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @resource_link.destroy!
        head :no_content
      end

      private

      def set_linkable
        if params[:unit_version_id]
          @linkable = UnitVersion.find(params[:unit_version_id])
        elsif params[:lesson_version_id]
          @linkable = LessonVersion.find(params[:lesson_version_id])
        elsif params[:assignment_id]
          @linkable = Assignment.find(params[:assignment_id])
        else
          render json: { error: "Linkable not found" }, status: :not_found
        end
      end

      def set_resource_link
        @resource_link = @linkable.resource_links.find(params[:id])
        authorize @resource_link
      end

      def resource_link_params
        params.require(:resource_link).permit(:url, :title, :mime_type, :drive_file_id, :provider)
      end
    end
  end
end
