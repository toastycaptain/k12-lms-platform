module Api
  module V1
    class DriveController < ApplicationController
      before_action :require_google_connected

      def create_document
        authorize :drive
        result = drive_service.create_document(
          params[:title],
          mime_type: params[:mime_type].presence || "application/vnd.google-apps.document"
        )

        create_resource_link(result) if linkable_requested?
        return if performed?

        render json: result, status: :created
      end

      def create_presentation
        authorize :drive
        result = drive_service.create_presentation(params[:title])

        create_resource_link(result) if linkable_requested?
        return if performed?

        render json: result, status: :created
      end

      def show_file
        authorize :drive
        result = drive_service.get_file(params[:file_id])
        render json: result
      end

      def share
        authorize :drive, :share?
        unless params[:file_id].present?
          render json: { error: "file_id is required" }, status: :unprocessable_content
          return
        end

        result = if params[:emails].present?
          drive_service.share_file_batch(
            params[:file_id],
            emails: Array(params[:emails]),
            role: params[:role].presence || "reader"
          )
        else
          unless params[:email].present?
            render json: { error: "email or emails is required" }, status: :unprocessable_content
            return
          end

          drive_service.share_file(
            params[:file_id],
            email: params[:email],
            role: params[:role].presence || "reader"
          )
        end

        render json: result
      end

      def folder
        authorize :drive, :folder?

        if request.post?
          unless params[:name].present?
            render json: { error: "name is required" }, status: :unprocessable_content
            return
          end

          parent_id = params[:parent_id]
          folder = drive_service.create_folder(params[:name], parent_id: parent_id)
          attach_course_folder!(folder) if params[:course_id].present? && parent_id.blank?
          render json: folder, status: :created
        else
          render json: drive_service.list_files(
            folder_id: params[:folder_id],
            query: params[:query],
            page_size: params[:page_size] || 50
          )
        end
      end

      def copy
        authorize :drive, :copy?
        unless params[:file_id].present? && params[:new_name].present?
          render json: { error: "file_id and new_name are required" }, status: :unprocessable_content
          return
        end

        result = drive_service.copy_file(
          params[:file_id],
          new_name: params[:new_name],
          folder_id: params[:folder_id]
        )
        render json: result, status: :created
      end

      def preview
        authorize :drive, :preview?
        render json: { preview_url: drive_service.preview_url(params[:file_id]) }
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
          render json: { error: "Google account not connected" }, status: :unprocessable_content
        end
      end

      def create_resource_link(drive_result)
        unless VALID_LINKABLE_TYPES.include?(params[:linkable_type])
          render json: { error: "Invalid linkable_type" }, status: :unprocessable_content
          return
        end

        linkable = params[:linkable_type].constantize.find(params[:linkable_id])
        ResourceLink.create!(
          tenant: Current.tenant,
          linkable: linkable,
          url: drive_result[:url],
          title: drive_result[:title] || drive_result[:name],
          provider: params[:provider].presence || "google_drive",
          drive_file_id: drive_result[:id],
          mime_type: drive_result[:mime_type],
          link_type: params[:link_type].presence || "reference",
          metadata: resource_link_metadata(linkable)
        )
      end

      def linkable_requested?
        params[:linkable_type].present? && params[:linkable_id].present?
      end

      def drive_service
        @drive_service ||= GoogleDriveService.new(Current.user)
      end

      def attach_course_folder!(folder)
        course = Course.find(params[:course_id])
        settings = course.settings.to_h
        settings["drive_folder_id"] = folder[:id]
        course.update!(settings: settings)
      end

      def resource_link_metadata(linkable)
        base_metadata = params.permit(metadata: [ :file_id, :file_name, :mime_type, :icon_url, :thumbnail_url, :web_view_link ]).to_h[:metadata] || {}
        base_metadata.merge(curriculum_metadata_for_linkable(linkable))
      end

      def curriculum_metadata_for_linkable(linkable)
        context = curriculum_context_for_linkable(linkable)
        return {} if context.blank?

        {
          "effective_curriculum_profile_key" => context[:profile_key],
          "effective_curriculum_source" => context[:source],
          "integration_context_tag" => context.dig(:integration_hints, "google_addon_context")
        }
      end

      def curriculum_context_for_linkable(linkable)
        course = course_for_linkable(linkable)
        return nil unless course

        CurriculumProfileResolver.resolve(tenant: Current.tenant, school: course.school, course: course)
      end

      def course_for_linkable(linkable)
        case linkable
        when Assignment, CourseModule
          linkable.course
        when LessonVersion
          linkable.lesson_plan&.unit_plan&.course
        when UnitVersion
          linkable.unit_plan&.course
        else
          nil
        end
      end
    end
  end
end
