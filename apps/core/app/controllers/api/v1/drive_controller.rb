module Api
  module V1
    class DriveController < ApplicationController
      before_action :require_google_connected

      def create_document
        authorize :drive
        drive_service = GoogleDriveService.new(Current.user)
        result = drive_service.create_document(params[:title])

        if params[:linkable_type].present? && params[:linkable_id].present?
          create_resource_link(result)
        end

        render json: result, status: :created
      end

      def create_presentation
        authorize :drive
        drive_service = GoogleDriveService.new(Current.user)
        result = drive_service.create_presentation(params[:title])

        if params[:linkable_type].present? && params[:linkable_id].present?
          create_resource_link(result)
        end

        render json: result, status: :created
      end

      def show_file
        authorize :drive
        drive_service = GoogleDriveService.new(Current.user)
        result = drive_service.get_file(params[:file_id])
        render json: result
      end

      def picker_token
        authorize :drive
        token_service = GoogleTokenService.new(Current.user)
        render json: {
          access_token: token_service.access_token,
          expires_in: ((Current.user.google_token_expires_at - Time.current).to_i rescue 3600)
        }
      end

      private

      VALID_LINKABLE_TYPES = %w[LessonVersion UnitVersion CourseModule Assignment].freeze

      def require_google_connected
        unless Current.user.google_connected?
          render json: { error: "Google account not connected" }, status: :unprocessable_entity
        end
      end

      def create_resource_link(drive_result)
        unless VALID_LINKABLE_TYPES.include?(params[:linkable_type])
          render json: { error: "Invalid linkable_type" }, status: :unprocessable_entity
          return
        end

        linkable = params[:linkable_type].constantize.find(params[:linkable_id])
        ResourceLink.create!(
          tenant: Current.tenant,
          linkable: linkable,
          url: drive_result[:url],
          title: drive_result[:title] || drive_result[:name],
          provider: "google_drive",
          drive_file_id: drive_result[:id],
          mime_type: drive_result[:mime_type]
        )
      end
    end
  end
end
