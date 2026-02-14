Rails.application.routes.draw do
  # OmniAuth callback routes
  get "/auth/:provider/callback", to: "api/v1/sessions#omniauth_callback"
  get "/auth/failure", to: "api/v1/sessions#failure"

  namespace :api do
    namespace :v1 do
      delete "/session", to: "sessions#destroy"
      get "/me", to: "sessions#me"

      resources :academic_years do
        get :standards_coverage, on: :member, controller: "standards_coverage", action: "academic_year_coverage"
      end
      resources :terms
      resources :courses do
        get :standards_coverage, on: :member, controller: "standards_coverage", action: "course_coverage"
        get :gradebook, on: :member, controller: "gradebook", action: "show"
        resources :modules, controller: "course_modules", only: [ :index, :create ]
        resources :assignments, only: [ :index, :create ]
        resources :discussions, only: [ :index, :create ]
        resources :announcements, only: [ :index, :create ]
        resources :quizzes, only: [ :index, :create ]
      end

      resources :announcements, only: [ :update, :destroy ]

      resources :discussions, only: [ :show, :update, :destroy ] do
        resources :posts, controller: "discussion_posts", only: [ :index, :create ]
      end
      resources :discussion_posts, only: [ :destroy ]

      resources :assignments, only: [ :show, :update, :destroy ] do
        member do
          post :publish
          post :close
        end
        resources :submissions, only: [ :index, :create ]
      end
      resources :submissions, only: [ :show ] do
        member do
          post :grade, controller: "submission_grading", action: "grade"
          post :return, controller: "submission_grading", action: "return_submission"
        end
        resources :rubric_scores, only: [ :index, :create ]
      end

      resources :modules, controller: "course_modules", only: [ :show, :update, :destroy ] do
        member do
          post :publish
          post :archive
          post :reorder_items
        end
        resources :module_items, only: [ :index, :create ]
      end
      resources :module_items, only: [ :show, :update, :destroy ]
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
          post :submit_for_approval
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
        resources :standards, only: [ :index, :create ], controller: "unit_version_standards" do
          collection do
            delete :bulk_destroy, action: :destroy
          end
        end
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

      resources :approvals, only: [ :index ] do
        member do
          post :approve
          post :reject
        end
      end

      resources :quizzes, only: [ :show, :update, :destroy ] do
        member do
          post :publish
          post :close
          post :reorder_items, controller: "quiz_items"
        end
        resources :quiz_items, only: [ :index, :create ]
      end
      resources :quiz_items, only: [ :update, :destroy ]

      resources :question_banks do
        post :archive, on: :member
        resources :questions, only: [ :index, :create ]
      end
      resources :questions, only: [ :show, :update, :destroy ]

      resources :rubrics do
        resources :criteria, controller: "rubric_criteria", only: [ :index, :create ]
      end
      resources :rubric_criteria, only: [ :update, :destroy ] do
        resources :ratings, controller: "rubric_ratings", only: [ :index, :create ]
      end
      resources :rubric_ratings, only: [ :update, :destroy ]

      resources :standard_frameworks do
        get :tree, on: :member, controller: "standards", action: "tree"
      end
      resources :standards
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
