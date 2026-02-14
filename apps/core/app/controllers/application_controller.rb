class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Pundit::Authorization

  before_action :authenticate_user!
  after_action :verify_authorized, unless: -> { skip_authorization? || action_name == "index" }
  after_action :verify_policy_scoped, if: -> { action_name == "index" && !skip_authorization? }

  rescue_from Pundit::NotAuthorizedError do |_exception|
    render json: { error: "Forbidden" }, status: :forbidden
  end

  rescue_from GoogleApiError do |exception|
    status = case exception.status_code
             when 401 then :unauthorized
             when 403 then :forbidden
             when 404 then :not_found
             when 429 then :too_many_requests
             else :bad_gateway
             end
    render json: { error: exception.message }, status: status
  end

  private

  def current_user
    Current.user
  end

  def pundit_user
    Current.user
  end

  def authenticate_user!
    resolve_tenant
    resolve_user

    unless Current.user
      render json: { error: "Unauthorized" }, status: :unauthorized
      return
    end

    unless Current.tenant
      render json: { error: "Forbidden: tenant not found" }, status: :forbidden
    end
  end

  def resolve_tenant
    tenant = tenant_from_session || tenant_from_header || tenant_from_subdomain
    Current.tenant = tenant
    RlsTenant.set_current_tenant(tenant.id) if tenant
  end

  def resolve_user
    return unless Current.tenant && session[:user_id]

    Current.user = User.unscoped.includes(:roles).find_by(id: session[:user_id], tenant_id: Current.tenant.id)
  end

  def tenant_from_session
    return unless session[:tenant_id]

    Tenant.unscoped.find_by(id: session[:tenant_id])
  end

  def tenant_from_header
    slug = request.headers["X-Tenant-Slug"]
    return unless slug.present?

    Tenant.unscoped.find_by(slug: slug)
  end

  def tenant_from_subdomain
    subdomain = request.subdomain
    return unless subdomain.present? && subdomain != "www"

    Tenant.unscoped.find_by(slug: subdomain)
  end

  def skip_authorization?
    false
  end
end
