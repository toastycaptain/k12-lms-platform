module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :omniauth_callback, :failure ]

      private def skip_authorization? = true

      def omniauth_callback
        auth = request.env["omniauth.auth"]

        unless auth
          return redirect_with_error("authentication_failed")
        end

        case auth.provider
        when "google_oauth2"
          handle_google_callback(auth)
        when "saml"
          handle_saml_callback(auth)
        else
          render json: { error: "Unsupported provider" }, status: :unprocessable_content
        end
      end

      def failure
        redirect_with_error(params[:message].presence || "authentication_failed")
      end

      def destroy
        audit_event(
          "session.signed_out",
          auditable: Current.user,
          metadata: { tenant_id: Current.tenant&.id }
        )
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
            roles: Current.user.role_names,
            district_admin: Current.user.district_admin?,
            google_connected: Current.user.google_connected?,
            onboarding_complete: Current.user.onboarding_complete,
            preferences: Current.user.preferences || {}
          },
          tenant: {
            id: Current.tenant.id,
            name: Current.tenant.name,
            slug: Current.tenant.slug
          }
        }
      end

      def update_me
        if Current.user.update(current_user_params)
          render json: {
            user: {
              id: Current.user.id,
              email: Current.user.email,
              first_name: Current.user.first_name,
              last_name: Current.user.last_name,
              roles: Current.user.role_names,
              district_admin: Current.user.district_admin?,
              google_connected: Current.user.google_connected?,
              onboarding_complete: Current.user.onboarding_complete,
              preferences: Current.user.preferences || {}
            },
            tenant: {
              id: Current.tenant.id,
              name: Current.tenant.name,
              slug: Current.tenant.slug
            }
          }
        else
          render json: { errors: Current.user.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def frontend_url
        ENV.fetch("FRONTEND_URL", "http://localhost:3000")
      end

      def redirect_with_error(error_code)
        encoded_error = CGI.escape(error_code.to_s)
        redirect_to "#{frontend_url}/auth/callback?error=#{encoded_error}",
          allow_other_host: true
      end

      def handle_google_callback(auth)
        tenant = resolve_tenant_from_auth(auth)
        unless tenant
          return redirect_with_error("tenant_not_found")
        end

        Current.tenant = tenant
        user = find_or_create_user(auth, tenant)
        unless user
          return redirect_with_error("identity_missing")
        end

        store_google_tokens(user, auth)
        complete_sign_in!(user: user, tenant: tenant, provider: auth.provider)

        redirect_to "#{frontend_url}/auth/callback",
          allow_other_host: true
      rescue ActiveRecord::RecordInvalid
        redirect_with_error("authentication_failed")
      end

      def handle_saml_callback(auth)
        tenant_slug = params[:tenant].presence || request.host.split(".").first
        tenant = Tenant.unscoped.find_by(slug: tenant_slug)
        return render json: { error: "Tenant not found" }, status: :not_found unless tenant

        Current.tenant = tenant

        email = saml_email(auth)
        if email.blank?
          return render json: { error: "No email in SAML response" }, status: :unprocessable_content
        end

        user = User.unscoped.find_by(email: email.downcase, tenant: tenant)

        if user.nil?
          saml_config = IntegrationConfig.unscoped.find_by(
            tenant: tenant,
            provider: "saml",
            status: "active"
          )

          unless saml_config&.settings&.dig("auto_provision")
            return render json: { error: "User not found and auto-provisioning is disabled" }, status: :not_found
          end

          user = User.unscoped.create!(
            email: email.downcase,
            first_name: saml_first_name(auth) || "User",
            last_name: saml_last_name(auth) || "",
            tenant: tenant
          )

          default_role = saml_config.settings["default_role"].presence || "student"
          user.add_role(default_role)
        end

        attach_identity!(user: user, provider: auth.provider.to_s, uid: auth.uid.to_s)

        complete_sign_in!(user: user, tenant: tenant, provider: auth.provider)

        redirect_to "#{frontend_url}/auth/callback",
          allow_other_host: true
      end

      def complete_sign_in!(user:, tenant:, provider:)
        session[:user_id] = user.id
        session[:tenant_id] = tenant.id
        audit_event(
          "session.signed_in",
          actor: user,
          auditable: user,
          metadata: {
            provider: provider,
            tenant_id: tenant.id
          }
        )
      end

      def resolve_tenant_from_auth(auth)
        email = auth.info&.email.to_s
        return nil if email.blank?

        email_domain = email.split("@").last
        return nil if email_domain.blank?

        Tenant.unscoped.find_by(slug: email_domain.split(".").first)
      end

      def find_or_create_user(auth, tenant)
        provider = auth.provider.to_s
        uid = auth.uid.to_s
        email = auth.info&.email.to_s.downcase

        user = find_user_by_identity(provider: provider, uid: uid, tenant: tenant)
        user ||= find_user_by_email(email: email, tenant: tenant)
        return nil if user.nil? && email.blank?

        user ||= User.unscoped.new(email: email, tenant: tenant)
        user.first_name = auth.info&.first_name
        user.last_name = auth.info&.last_name
        attach_identity!(user: user, provider: provider, uid: uid)
        user.save!
        user
      end

      def saml_email(auth)
        auth.info&.email.presence ||
          extract_saml_attribute(auth, "email") ||
          extract_saml_attribute(auth, "mail")
      end

      def saml_first_name(auth)
        auth.info&.first_name.presence ||
          extract_saml_attribute(auth, "first_name") ||
          extract_saml_attribute(auth, "givenName")
      end

      def saml_last_name(auth)
        auth.info&.last_name.presence ||
          extract_saml_attribute(auth, "last_name") ||
          extract_saml_attribute(auth, "sn")
      end

      def extract_saml_attribute(auth, key)
        attributes = auth.respond_to?(:attributes) ? auth.attributes : nil
        value = attributes&.[](key) || attributes&.[](key.to_sym)
        value = value.first if value.is_a?(Array)
        value.presence
      end

      def store_google_tokens(user, auth)
        return unless auth.credentials

        attrs = { google_access_token: auth.credentials.token }
        attrs[:google_refresh_token] = auth.credentials.refresh_token if auth.credentials.refresh_token.present?
        attrs[:google_token_expires_at] = Time.at(auth.credentials.expires_at) if auth.credentials.expires_at.present?

        user.update!(attrs)
      end

      def find_user_by_identity(provider:, uid:, tenant:)
        return nil if provider.blank? || uid.blank?

        User.unscoped
          .where(tenant: tenant)
          .where("preferences -> 'auth_identities' ->> ? = ?", provider, uid)
          .first
      end

      def find_user_by_email(email:, tenant:)
        return nil if email.blank?

        User.unscoped.find_by(email: email, tenant: tenant)
      end

      def attach_identity!(user:, provider:, uid:)
        return if provider.blank? || uid.blank?

        preferences = user.preferences.is_a?(Hash) ? user.preferences.deep_dup : {}
        identities = preferences["auth_identities"].is_a?(Hash) ? preferences["auth_identities"].dup : {}
        identities[provider] = uid
        preferences["auth_identities"] = identities
        user.preferences = preferences
      end

      def current_user_params
        params.permit(:onboarding_complete, preferences: {})
      end
    end
  end
end
