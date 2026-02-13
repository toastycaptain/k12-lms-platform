Rails.application.routes.draw do
  # OmniAuth callback routes
  get "/auth/:provider/callback", to: "api/v1/sessions#omniauth_callback"
  get "/auth/failure", to: "api/v1/sessions#failure"

  namespace :api do
    namespace :v1 do
      delete "/session", to: "sessions#destroy"
      get "/me", to: "sessions#me"

      resources :academic_years
      resources :terms
      resources :courses
      resources :sections
      resources :enrollments

      resources :unit_plans do
        member do
          post :create_version
          get :versions
          post :publish
          post :archive
          post :export_pdf
          get :export_pdf_status
        end

        resources :lesson_plans do
          member do
            post :create_version
            get :versions
          end
        end
      end

      resources :unit_versions, only: [] do
        resources :resource_links, only: [ :index, :create, :destroy ]
      end
      resources :lesson_versions, only: [] do
        resources :resource_links, only: [ :index, :create, :destroy ]
      end

      resources :templates do
        member do
          post :create_version
          get :versions
          post :publish
          post :archive
          post :create_unit
        end
      end

      resources :template_versions, only: [] do
        resources :standards, only: [ :index, :create, :destroy ], controller: "template_version_standards"
      end

      resources :standard_frameworks do
        get :tree, on: :member, controller: "standards", action: "tree"
      end
      resources :standards
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
