module Api
  module V1
    module Mobile
      class SessionsController < ApplicationController
        skip_before_action :authenticate_user!, only: %i[refresh destroy]
        skip_forgery_protection only: %i[refresh destroy]

        before_action :resolve_mobile_tenant!
        before_action :ensure_authenticated_tenant_matches!, only: %i[create]

        private def skip_authorization? = true

        def create
          token_bundle = MobileSessionTokenService.issue_session!(
            user: Current.user,
            tenant: Current.tenant,
            user_agent: request.user_agent,
            ip_address: request.remote_ip
          )

          render json: token_bundle, status: :created
        end

        def refresh
          token_bundle = MobileSessionTokenService.refresh_session!(
            refresh_token: params[:refresh_token],
            tenant: @mobile_tenant,
            user_agent: request.user_agent,
            ip_address: request.remote_ip
          )

          if token_bundle
            render json: token_bundle, status: :ok
          else
            render json: { error: "Invalid refresh token" }, status: :unauthorized
          end
        end

        def destroy
          revoked = MobileSessionTokenService.revoke_session!(
            refresh_token: params[:refresh_token],
            tenant: @mobile_tenant
          )

          if revoked
            render json: { message: "Mobile session revoked" }, status: :ok
          else
            render json: { error: "Invalid refresh token" }, status: :unauthorized
          end
        end

        private

        def resolve_mobile_tenant!
          slug = request.headers["X-Tenant-Slug"].to_s.strip
          if slug.blank?
            render json: { error: "X-Tenant-Slug header is required" }, status: :unprocessable_content
            return
          end

          @mobile_tenant = Tenant.unscoped.find_by(slug: slug)
          unless @mobile_tenant
            render json: { error: "Tenant not found" }, status: :not_found
            return
          end

          Current.tenant ||= @mobile_tenant
        end

        def ensure_authenticated_tenant_matches!
          return if performed?
          return if Current.tenant&.id == @mobile_tenant.id

          render json: { error: "Forbidden" }, status: :forbidden
        end
      end
    end
  end
end
