module Api
  module V1
    class LtiResourceLinksController < ApplicationController
      before_action :set_lti_registration
      before_action :set_lti_resource_link, only: [ :show, :update, :destroy ]

      def index
        authorize LtiResourceLink
        links = policy_scope(LtiResourceLink).where(lti_registration: @lti_registration).order(updated_at: :desc)
        render json: links
      end

      def show
        authorize @lti_resource_link
        render json: @lti_resource_link
      end

      def create
        @lti_resource_link = @lti_registration.lti_resource_links.new(
          with_curriculum_context(lti_resource_link_params)
        )
        @lti_resource_link.tenant = Current.tenant
        authorize @lti_resource_link

        if @lti_resource_link.save
          render json: @lti_resource_link, status: :created
        else
          render json: { errors: @lti_resource_link.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @lti_resource_link
        if @lti_resource_link.update(with_curriculum_context(lti_resource_link_params))
          render json: @lti_resource_link
        else
          render json: { errors: @lti_resource_link.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @lti_resource_link
        @lti_resource_link.destroy!
        head :no_content
      end

      private

      def set_lti_registration
        @lti_registration = LtiRegistration.find(params[:lti_registration_id])
      end

      def set_lti_resource_link
        @lti_resource_link = @lti_registration.lti_resource_links.find(params[:id])
      end

      def lti_resource_link_params
        params.require(:lti_resource_link).permit(
          :title,
          :description,
          :url,
          :course_id,
          custom_params: {}
        )
      end

      def with_curriculum_context(attributes)
        attrs = attributes.to_h.deep_dup
        course_id = attrs["course_id"] || attrs[:course_id]
        return attrs unless course_id.present?

        course = policy_scope(Course).find_by(id: course_id)
        return attrs unless course

        resolved = CurriculumProfileResolver.resolve(
          tenant: Current.tenant,
          school: course.school,
          course: course
        )

        custom_params = attrs["custom_params"] || attrs[:custom_params] || {}
        custom_params = custom_params.to_h
        custom_params["effective_curriculum_profile_key"] ||= resolved[:profile_key]
        custom_params["effective_curriculum_source"] ||= resolved[:source]
        custom_params["lti_context_tag"] ||= resolved.dig(:integration_hints, "lti_context_tag")

        attrs["custom_params"] = custom_params
        attrs
      end
    end
  end
end
