module Api
  module V1
    class LtiRegistrationsController < ApplicationController
      before_action :set_lti_registration, only: [ :show, :update, :destroy, :activate, :deactivate ]

      def index
        authorize LtiRegistration
        registrations = policy_scope(LtiRegistration)
        render json: registrations
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
        params.permit(:name, :description, :issuer, :client_id, :auth_login_url,
          :auth_token_url, :jwks_url, :deployment_id, :status, settings: {})
      end
    end
  end
end
