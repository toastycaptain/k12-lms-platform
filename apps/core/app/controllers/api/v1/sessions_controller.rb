module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :omniauth_callback, :failure ]

      private def skip_authorization? = true

      def omniauth_callback
        auth = request.env["omniauth.auth"]

        unless auth
          render json: { error: "Authentication failed" }, status: :unauthorized
          return
        end

        tenant = resolve_tenant_from_auth(auth)
        unless tenant
          render json: { error: "No tenant found for this account" }, status: :forbidden
          return
        end

        Current.tenant = tenant
        user = find_or_create_user(auth, tenant)
        store_google_tokens(user, auth)

        session[:user_id] = user.id
        session[:tenant_id] = tenant.id

        redirect_to ENV.fetch("FRONTEND_URL", "http://localhost:3000") + "/auth/callback",
          allow_other_host: true
      end

      def failure
        render json: { error: "Authentication failed: #{params[:message]}" }, status: :unauthorized
      end

      def destroy
        reset_session
        render json: { message: "Signed out successfully" }, status: :ok
      end

      def me
        render json: {
          user: {
            id: Current.user.id,
            email: Current.user.email,
            first_name: Current.user.first_name,
            last_name: Current.user.last_name,
            roles: Current.user.roles.pluck(:name),
            google_connected: Current.user.google_connected?
          },
          tenant: {
            id: Current.tenant.id,
            name: Current.tenant.name,
            slug: Current.tenant.slug
          }
        }
      end

      private

      def resolve_tenant_from_auth(auth)
        email_domain = auth.info.email.split("@").last
        Tenant.unscoped.find_by(slug: email_domain.split(".").first)
      end

      def find_or_create_user(auth, tenant)
        User.unscoped.find_or_initialize_by(email: auth.info.email, tenant: tenant).tap do |user|
          user.first_name = auth.info.first_name
          user.last_name = auth.info.last_name
          user.save!
        end
      end

      def store_google_tokens(user, auth)
        return unless auth.credentials

        attrs = { google_access_token: auth.credentials.token }
        attrs[:google_refresh_token] = auth.credentials.refresh_token if auth.credentials.refresh_token.present?
        attrs[:google_token_expires_at] = Time.at(auth.credentials.expires_at) if auth.credentials.expires_at.present?

        user.update!(attrs)
      end
    end
  end
end
