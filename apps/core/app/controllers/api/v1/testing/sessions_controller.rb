module Api
  module V1
    module Testing
      class SessionsController < ApplicationController
        skip_before_action :authenticate_user!
        before_action :reject_in_production

        DEFAULT_EMAIL_BY_ROLE = {
          "admin" => "admin@e2e.local",
          "teacher" => "teacher@e2e.local",
          "student" => "student@e2e.local"
        }.freeze

        def create
          tenant = Tenant.unscoped.find_by(slug: tenant_slug)
          return render json: { error: "Tenant not found" }, status: :not_found unless tenant

          Current.tenant = tenant
          target_role = params[:role].to_s
          target_email = params[:email].presence || DEFAULT_EMAIL_BY_ROLE[target_role]
          return render json: { error: "Email is required" }, status: :unprocessable_content if target_email.blank?

          user = User.unscoped.find_by(email: target_email, tenant_id: tenant.id)
          return render json: { error: "User not found" }, status: :not_found unless user

          if target_role.present? && !user.has_role?(target_role)
            return render json: { error: "User does not have requested role" }, status: :unprocessable_content
          end

          reset_session
          session[:tenant_id] = tenant.id
          session[:user_id] = user.id

          render json: {
            user: {
              id: user.id,
              email: user.email,
              roles: user.role_names
            },
            tenant: {
              id: tenant.id,
              slug: tenant.slug
            }
          }
        ensure
          Current.tenant = nil
        end

        def destroy
          reset_session
          render json: { ok: true }
        end

        private

        def reject_in_production
          head :not_found if Rails.env.production?
        end

        def tenant_slug
          params[:tenant_slug].presence || "e2e-district"
        end

        def skip_authorization?
          true
        end
      end
    end
  end
end
