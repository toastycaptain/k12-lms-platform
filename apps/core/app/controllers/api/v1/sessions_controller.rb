module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :omniauth_callback, :failure ]

      private def skip_authorization? = true

      def omniauth_callback
        auth = request.env["omniauth.auth"]

        unless auth
          MetricsService.increment("auth.failure", tags: { reason: "missing_auth_payload" })
          return redirect_with_error("authentication_failed")
        end

        case auth.provider
        when "google_oauth2"
          handle_google_callback(auth)
        when "saml"
          handle_saml_callback(auth)
        else
          MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "unsupported_provider" })
          render json: { error: "Unsupported provider" }, status: :unprocessable_content
        end
      end

      def failure
        MetricsService.increment("auth.failure", tags: { reason: params[:message].presence || "omniauth_failure" })
        redirect_with_error(params[:message].presence || "authentication_failed")
      end

      def destroy
        audit_event(
          "session.signed_out",
          auditable: Current.user,
          metadata: { tenant_id: Current.tenant&.id }
        )
        MetricsService.increment(
          "auth.sign_out",
          tags: { tenant_id: Current.tenant&.id, user_id: Current.user&.id }
        )
        reset_session
        render json: { message: "Signed out successfully" }, status: :ok
      end

      def start_impersonation
        unless can_manage_impersonation?
          render json: { error: "Forbidden" }, status: :forbidden
          return
        end

        if impersonating?
          render json: { error: "An impersonation session is already active" }, status: :unprocessable_content
          return
        end

        target_user = User.unscoped.find_by(id: params[:user_id], tenant_id: Current.tenant.id)
        unless target_user
          render json: { error: "User not found" }, status: :not_found
          return
        end

        if target_user.id == Current.user.id
          render json: { error: "Cannot impersonate your own account" }, status: :unprocessable_content
          return
        end

        impersonator = Current.user
        tenant = Current.tenant
        reset_session
        clear_impersonation_session_state!
        session[:tenant_id] = tenant.id
        session[:impersonator_user_id] = impersonator.id
        session[:impersonator_tenant_id] = tenant.id
        session[:impersonated_user_id] = target_user.id
        session[:user_id] = target_user.id
        session[:last_seen_at] = Time.current.to_i
        Current.tenant = tenant
        Current.user = target_user

        audit_event(
          "session.impersonation.started",
          actor: impersonator,
          auditable: target_user,
          metadata: {
            tenant_id: tenant.id,
            impersonator_user_id: impersonator.id,
            impersonated_user_id: target_user.id
          }
        )

        render json: session_payload
      end

      def stop_impersonation
        impersonator = impersonator_user
        unless impersonator
          render json: { error: "No active impersonation session" }, status: :unprocessable_content
          return
        end

        impersonated_user = Current.user
        impersonator_tenant = impersonator.tenant
        reset_session
        clear_impersonation_session_state!
        session[:tenant_id] = impersonator_tenant.id
        session[:user_id] = impersonator.id
        session[:last_seen_at] = Time.current.to_i

        Current.tenant = impersonator_tenant
        Current.user = impersonator

        audit_event(
          "session.impersonation.ended",
          actor: impersonator,
          auditable: impersonated_user,
          metadata: {
            tenant_id: impersonator.tenant_id,
            impersonator_user_id: impersonator.id,
            impersonated_user_id: impersonated_user&.id
          }
        )

        render json: session_payload
      end

      def me
        render json: session_payload
      end

      def update_me
        if Current.user.update(current_user_params)
          render json: session_payload
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
          MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "tenant_not_found" })
          return redirect_with_error("tenant_not_found")
        end

        Current.tenant = tenant
        user = find_or_create_user(auth, tenant)
        unless user
          MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "identity_missing" })
          return redirect_with_error("identity_missing")
        end

        store_google_tokens(user, auth)
        complete_sign_in!(user: user, tenant: tenant, provider: auth.provider)

        redirect_to "#{frontend_url}/auth/callback",
          allow_other_host: true
      rescue ActiveRecord::RecordInvalid
        MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "record_invalid" })
        redirect_with_error("authentication_failed")
      end

      def handle_saml_callback(auth)
        tenant_slug = params[:tenant].presence || request.host.split(".").first
        tenant = Tenant.unscoped.find_by(slug: tenant_slug)
        unless tenant
          MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "tenant_not_found" })
          return render json: { error: "Tenant not found" }, status: :not_found
        end

        Current.tenant = tenant

        email = saml_email(auth)
        if email.blank?
          MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "email_missing" })
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
            MetricsService.increment("auth.failure", tags: { provider: auth.provider, reason: "user_not_found" })
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
        reset_session
        clear_impersonation_session_state!
        session[:user_id] = user.id
        session[:tenant_id] = tenant.id
        session[:last_seen_at] = Time.current.to_i
        MetricsService.increment(
          "auth.success",
          tags: {
            provider: provider,
            tenant_id: tenant.id,
            user_id: user.id
          }
        )
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
        email_domain = extract_email_domain(auth)

        find_tenant_by_slug(params[:tenant]) ||
          find_tenant_from_domain(email_domain) ||
          fallback_tenant_for_auth(auth, email_domain)
      end

      def extract_email_domain(auth)
        email = auth.info&.email.to_s.downcase
        return nil if email.blank?

        email.split("@").last.to_s.downcase.presence
      end

      def find_tenant_from_domain(email_domain)
        return nil if email_domain.blank?

        slug_candidates = [
          email_domain,
          email_domain.split(".").first,
          email_domain.tr(".", "-")
        ].compact.uniq

        slug_candidates.each do |candidate|
          tenant = find_tenant_by_slug(candidate)
          return tenant if tenant
        end

        nil
      end

      def find_tenant_by_slug(raw_slug)
        slug = normalize_tenant_slug(raw_slug)
        return nil if slug.blank?

        Tenant.unscoped.find_by(slug: slug)
      end

      def fallback_tenant_for_auth(auth, email_domain)
        tenant_count = Tenant.unscoped.count

        if tenant_count == 1
          return Tenant.unscoped.first
        end

        if tenant_count.zero?
          return provision_first_tenant(auth, email_domain)
        end

        nil
      end

      def provision_first_tenant(auth, email_domain)
        email = auth.info&.email.to_s.downcase
        return nil if email.blank?

        slug_source = email_domain.to_s.split(".").first.presence || email.split("@").first
        subdomain = normalize_tenant_slug(slug_source)
        return nil if subdomain.blank?

        school_name = [ slug_source.to_s.tr("-", " ").split.map(&:capitalize).join(" "), "School" ]
          .join(" ")
          .strip

        TenantProvisioningService.new(
          school_name: school_name,
          subdomain: subdomain,
          admin_email: email,
          admin_first_name: auth.info&.first_name,
          admin_last_name: auth.info&.last_name,
          ai_enabled: true,
          google_enabled: true
        ).call[:tenant]
      rescue TenantProvisioningService::ProvisioningError => e
        Rails.logger.warn("[SessionsController] Auto tenant provisioning failed: #{e.message}")
        nil
      end

      def normalize_tenant_slug(raw_slug)
        raw_slug.to_s
          .downcase
          .gsub(/[^a-z0-9-]/, "-")
          .gsub(/-+/, "-")
          .gsub(/\A-|-+\z/, "")
          .presence
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
        params.permit(
          :onboarding_complete,
          preferences: [
            :theme,
            :locale,
            :timezone,
            :email_notifications,
            :digest_frequency,
            :dashboard_layout,
            :sidebar_collapsed,
            subjects: [],
            grade_levels: []
          ]
        )
      end

      def session_payload
        {
          user: current_user_payload,
          tenant: current_tenant_payload
        }
      end

      def current_user_payload
        {
          id: Current.user.id,
          email: Current.user.email,
          first_name: Current.user.first_name,
          last_name: Current.user.last_name,
          roles: Current.user.role_names,
          district_admin: Current.user.district_admin?,
          google_connected: Current.user.google_connected?,
          onboarding_complete: Current.user.onboarding_complete,
          preferences: Current.user.preferences || {},
          impersonating: impersonating?,
          impersonator: impersonator_payload
        }
      end

      def current_tenant_payload
        resolved = tenant_curriculum_runtime
        roles = Array(Current.user&.role_names).map(&:to_s)
        navigation = resolved[:navigation] || {}

        {
          id: Current.tenant.id,
          name: Current.tenant.name,
          slug: Current.tenant.slug,
          curriculum_default_profile_key: Current.tenant.settings&.dig("curriculum_default_profile_key") || CurriculumProfileRegistry.default_profile_key,
          curriculum_default_profile_version: Current.tenant.settings&.dig("curriculum_default_profile_version"),
          curriculum_runtime: {
            profile_key: resolved[:profile_key],
            profile_version: resolved[:resolved_profile_version],
            selected_from: resolved[:selected_from],
            terminology: resolved[:terminology],
            navigation: navigation,
            visible_navigation: roles.flat_map { |role| Array(navigation[role]) }.uniq
          }
        }
      end

      def tenant_curriculum_runtime
        @tenant_curriculum_runtime ||= CurriculumProfileResolver.resolve(tenant: Current.tenant)
      end

      def can_manage_impersonation?
        Current.user&.has_role?(:admin) || Current.user&.district_admin?
      end

      def impersonating?
        session[:impersonator_user_id].present?
      end

      def impersonator_user
        return @impersonator_user if defined?(@impersonator_user)

        impersonator_id = session[:impersonator_user_id]
        impersonator_tenant_id = session[:impersonator_tenant_id] || Current.tenant&.id
        @impersonator_user = if impersonator_id.present? && impersonator_tenant_id.present?
          User.unscoped.find_by(id: impersonator_id, tenant_id: impersonator_tenant_id)
        end
      end

      def impersonator_payload
        actor = impersonator_user
        return nil unless actor

        {
          id: actor.id,
          email: actor.email,
          first_name: actor.first_name,
          last_name: actor.last_name
        }
      end

      def clear_impersonation_session_state!
        session.delete(:impersonator_user_id)
        session.delete(:impersonator_tenant_id)
        session.delete(:impersonated_user_id)
        remove_instance_variable(:@impersonator_user) if defined?(@impersonator_user)
      end
    end
  end
end
