Rails.application.routes.draw do
  # OmniAuth callback routes
  get "/auth/:provider/callback", to: "api/v1/sessions#omniauth_callback"
  get "/auth/failure", to: "api/v1/sessions#failure"

  namespace :api do
    namespace :v1 do
      delete "/session", to: "sessions#destroy"
      get "/me", to: "sessions#me"
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
