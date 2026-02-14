class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Pundit::Authorization

  before_action :authenticate_user!
  after_action :verify_authorized, unless: -> { skip_authorization? || action_name == "index" }
  after_action :verify_policy_scoped, if: -> { action_name == "index" && !skip_authorization? }

  rescue_from Pundit::NotAuthorizedError do |_exception|
    render json: { error: "Forbidden" }, status: :forbidden
  end

  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

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
  end

  def resolve_user
    return unless Current.tenant && session[:user_id]

    Current.user = User.unscoped.find_by(id: session[:user_id], tenant_id: Current.tenant.id)
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

  def record_not_found
    render json: { error: "Not found" }, status: :not_found
  end
end
