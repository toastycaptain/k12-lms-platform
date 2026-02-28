class ApplicationController < ActionController::API
  include ActionController::Cookies
  include ActionController::RequestForgeryProtection
  include Paginatable
  include Pundit::Authorization
  include RateLimitHeaders

  SECURITY_HEADERS = {
    "X-Frame-Options" => "SAMEORIGIN",
    "X-Content-Type-Options" => "nosniff",
    "X-XSS-Protection" => "0",
    "Referrer-Policy" => "strict-origin-when-cross-origin",
    "X-Permitted-Cross-Domain-Policies" => "none",
    "Permissions-Policy" => "camera=(), microphone=(), geolocation=()"
  }.freeze

  protect_from_forgery with: :exception, unless: :csrf_exempt_request?, if: :csrf_protection_enabled?

  before_action :authenticate_user!
  after_action :set_security_headers
  after_action :verify_authorized, unless: -> { skip_authorization? || action_name == "index" }
  after_action :verify_policy_scoped, if: -> { action_name == "index" && !skip_authorization? }

  rescue_from Pundit::NotAuthorizedError do |_exception|
    render json: { error: "Forbidden" }, status: :forbidden
  end

  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActionController::InvalidAuthenticityToken, with: :invalid_authenticity_token

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
    apply_auth_bypass! if auth_bypass_enabled? && Current.user.nil?
    set_request_context

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
    if (token = bearer_token)
      return resolve_user_from_mobile_access_token(token)
    end

    return unless Current.tenant && session[:user_id]

    if session_stale?
      reset_session
      return
    end

    Current.user = User.unscoped.find_by(id: session[:user_id], tenant_id: Current.tenant.id)
    session[:last_seen_at] = Time.current.to_i if Current.user
  end

  def auth_bypass_enabled?
    raw = ENV["AUTH_BYPASS_MODE"]
    raw.present? && %w[1 true yes on].include?(raw.to_s.strip.downcase)
  end

  def apply_auth_bypass!
    preferred_email = ENV["AUTH_BYPASS_USER_EMAIL"].to_s.strip.downcase.presence
    tenant = Current.tenant || Tenant.unscoped.order(:id).first
    user = nil

    if preferred_email && tenant
      user = User.unscoped.find_by(email: preferred_email, tenant_id: tenant.id)
    end

    if user.nil? && tenant
      user = User.unscoped.where(tenant_id: tenant.id).order(:id).first
    end

    if user.nil?
      user = User.unscoped.order(:id).first
      tenant ||= user&.tenant
    end

    return unless tenant && user

    Current.tenant = tenant
    Current.user = user
    session[:tenant_id] = tenant.id
    session[:user_id] = user.id
    session[:last_seen_at] = Time.current.to_i
  end

  def session_stale?
    last_seen = session[:last_seen_at]
    return false unless last_seen

    Time.current.to_i - last_seen.to_i > 12.hours.to_i
  end

  def set_request_context
    request.env["current_tenant_id"] = Current.tenant&.id
    request.env["current_user_id"] = Current.user&.id
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

  def audit_event(event_type, auditable: nil, actor: Current.user, metadata: {})
    AuditLogger.log(
      event_type: event_type,
      actor: actor,
      auditable: auditable,
      metadata: metadata,
      request: request
    )
  end

  def skip_authorization?
    false
  end

  def record_not_found
    render json: { error: "Not found" }, status: :not_found
  end

  def invalid_authenticity_token
    render json: { error: "Invalid CSRF token" }, status: :forbidden
  end

  def csrf_exempt_request?
    request.authorization.to_s.start_with?("Bearer ")
  end

  def csrf_protection_enabled?
    !Rails.env.test? || ActionController::Base.allow_forgery_protection
  end

  def bearer_token
    header = request.authorization.to_s
    return nil unless header.start_with?("Bearer ")

    header.delete_prefix("Bearer ").strip.presence
  end

  def resolve_user_from_mobile_access_token(token)
    auth = MobileSessionTokenService.authenticate_access_token(token)
    return unless auth

    Current.tenant = auth[:tenant]
    Current.user = auth[:user]
  end

  def set_security_headers
    SECURITY_HEADERS.each { |key, value| response.headers[key] = value }
  end
end
