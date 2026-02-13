class ApplicationController < ActionController::API
  include ActionController::Cookies

  before_action :authenticate_user!

  private

  def authenticate_user!
    if session[:user_id] && session[:tenant_id]
      Current.tenant = Tenant.unscoped.find_by(id: session[:tenant_id])
      Current.user = Current.tenant&.users&.unscoped&.find_by(id: session[:user_id])
    end

    render json: { error: "Unauthorized" }, status: :unauthorized unless Current.user
  end
end
