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
        @lti_resource_link = @lti_registration.lti_resource_links.new(lti_resource_link_params)
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
        if @lti_resource_link.update(lti_resource_link_params)
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
    end
  end
end
