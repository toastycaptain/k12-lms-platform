module Api
  module V1
    class LtiRegistrationsController < ApplicationController
      before_action :set_lti_registration, only: [ :show, :update, :destroy, :activate, :deactivate ]

      def index
        authorize LtiRegistration
        render json: policy_scope(LtiRegistration).order(updated_at: :desc)
      end

      def show
        authorize @lti_registration
        render json: @lti_registration
      end

      def create
        @lti_registration = LtiRegistration.new(lti_registration_params)
        @lti_registration.tenant = Current.tenant
        @lti_registration.created_by = Current.user
        authorize @lti_registration

        if @lti_registration.save
          render json: @lti_registration, status: :created
        else
          render json: { errors: @lti_registration.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @lti_registration
        if @lti_registration.update(lti_registration_params)
          render json: @lti_registration
        else
          render json: { errors: @lti_registration.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @lti_registration
        @lti_registration.destroy!
        head :no_content
      end

      def activate
        authorize @lti_registration
        @lti_registration.activate!
        render json: @lti_registration
      end

      def deactivate
        authorize @lti_registration
        @lti_registration.deactivate!
        render json: @lti_registration
      end

      private

      def set_lti_registration
        @lti_registration = LtiRegistration.find(params[:id])
      end

      def lti_registration_params
        params.require(:lti_registration).permit(
          :name,
          :issuer,
          :client_id,
          :deployment_id,
          :auth_login_url,
          :auth_token_url,
          :jwks_url,
          :description,
          :status,
          settings: [
            :deployment_id,
            :custom_params,
            :deep_linking_enabled
          ]
        )
      end
    end
  end
end
