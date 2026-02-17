Rails.application.routes.draw do
  # OmniAuth callback routes
  match "/auth/:provider/callback", to: "api/v1/sessions#omniauth_callback", via: [ :get, :post ]
  get "/auth/failure", to: "api/v1/sessions#failure"

  # LTI 1.3 Protocol Endpoints
  namespace :lti do
    match "oidc_login", to: "launches#oidc_login", via: [ :get, :post ]
    post "launch", to: "launches#launch"
    get "jwks", to: "launches#jwks"
  end

  namespace :api do
    namespace :v1 do
      get "/health", to: "health#show"
      get "/csrf", to: "csrf#show"
      get "saml/metadata", to: "saml#metadata"

      delete "/session", to: "sessions#destroy"
      get "/me", to: "sessions#me"
      patch "/me", to: "sessions#update_me"
      get "/search", to: "search#index"

      resources :academic_years do
        get :standards_coverage, on: :member, controller: "standards_coverage", action: "by_academic_year"
      end
      resources :terms
      resources :courses do
        get :standards_coverage, on: :member, controller: "standards_coverage", action: "by_course"
        get :gradebook, on: :member, controller: "gradebook", action: "show"
        get "gradebook/export", on: :member, controller: "gradebook", action: "export"
        get :quiz_performance, on: :member, controller: "quiz_analytics", action: "course_summary"
        resources :modules, controller: "course_modules", only: [ :index, :create ]
        resources :course_modules, controller: "course_modules", only: [ :index ]
        resources :assignments, only: [ :index, :create ]
        resources :discussions, only: [ :index, :create ]
        resources :announcements, only: [ :index, :create ]
        resources :quizzes, only: [ :index, :create ]
      end

      resources :announcements, only: [ :index, :create, :update, :destroy ]
      resources :message_threads, only: [ :index, :show, :create, :destroy ] do
        resources :messages, only: [ :index, :create ]
      end

      resources :discussions, only: [ :show, :update, :destroy ] do
        member do
          post :lock
          post :unlock
        end
        resources :posts, controller: "discussion_posts", only: [ :index, :create ]
      end
      resources :discussion_posts, only: [ :destroy ]

      resources :assignments, only: [ :index, :show, :update, :destroy ] do
        member do
          post :publish
          post :close
          post :push_to_classroom
          post :sync_grades
        end
        resources :resource_links, only: [ :index, :create, :destroy ], controller: "resource_links"
        resources :submissions, only: [ :index, :create ]
        resources :standards, only: [ :index, :create ], controller: "assignment_standards" do
          collection do
            delete :bulk_destroy, action: :destroy
          end
        end
      end
      resources :submissions, only: [ :index, :show, :update ] do
        member do
          post :grade, controller: "submission_grading", action: "grade"
          post :return, controller: "submission_grading", action: "return_submission"
        end
        resources :rubric_scores, only: [ :index, :create ]
      end

      resources :course_modules, only: [] do
        patch :reorder, on: :member
        get :progress, on: :member, controller: "module_item_completions"
      end

      resources :modules, controller: "course_modules", only: [ :show, :update, :destroy ] do
        member do
          post :publish
          post :archive
          post :reorder_items
        end
        resources :module_items, only: [ :index, :create ]
      end
      resources :module_items, only: [ :show, :update, :destroy ] do
        member do
          post :complete, controller: "module_item_completions", action: "create"
          delete :complete, controller: "module_item_completions", action: "destroy"
        end
      end
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

      resources :ai_provider_configs, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :activate
          post :deactivate
        end
      end
      resources :ai_task_policies, only: [ :index, :show, :create, :update, :destroy ]
      resources :ai_templates, only: [ :index, :show, :create, :update, :destroy ]
      resources :ai_invocations, only: [ :index, :show, :create ]
      post "ai/stream", to: "ai_stream#create"

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
          get :results
          get :analytics, controller: "quiz_analytics", action: "show"
        end
        resources :quiz_items, only: [ :index, :create ]
        resources :quiz_attempts, only: [ :index, :create ], path: "attempts"
        resources :quiz_accommodations, only: [ :index, :create ], path: "accommodations"
      end
      resources :quiz_items, only: [ :update, :destroy ]
      resources :quiz_attempts, only: [ :show ] do
        member do
          post :submit
          post :grade_all
        end
        resources :answers, controller: "attempt_answers", only: [ :index, :create ]
      end
      resources :quiz_accommodations, only: [ :update, :destroy ]
      resources :attempt_answers, only: [] do
        post :grade, on: :member, controller: "attempt_answer_grading"
      end

      resources :question_banks do
        member do
          post :archive
          post :export_qti
          get :export_qti_status
          post :import_qti
        end
        resources :questions, only: [ :index, :create ]
      end
      resources :questions, only: [ :show, :update, :destroy ] do
        member do
          post :create_version
        end
        resources :question_versions, only: [ :index, :show, :create ]
      end

      resources :rubrics do
        resources :criteria, controller: "rubric_criteria", only: [ :index, :create ]
      end
      resources :rubric_criteria, only: [ :update, :destroy ] do
        resources :ratings, controller: "rubric_ratings", only: [ :index, :create ]
      end
      resources :rubric_ratings, only: [ :update, :destroy ]

      resources :integration_configs do
        member do
          post :activate
          post :deactivate
          post :sync_courses
          post :sync_organizations
          post :sync_users
        end
        resources :sync_mappings, only: [ :index ]
        resources :sync_runs, only: [ :index ]
      end
      resources :sync_mappings, only: [ :index, :show, :destroy ] do
        member do
          post :sync_roster
        end
      end
      resources :sync_runs, only: [ :show ] do
        resources :sync_logs, only: [ :index ]
      end

      resources :lti_registrations, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :activate
          post :deactivate
        end
        resources :lti_resource_links, only: [ :index, :show, :create, :update, :destroy ]
      end
      get "lti_resource_links/:id", to: "lti_resource_links_lookup#show", as: :lti_resource_link
      namespace :lti do
        post "deep_link_response", to: "/lti/deep_links#create"
      end
      resources :data_retention_policies, only: [ :index, :show, :create, :update, :destroy ] do
        member do
          post :enforce
        end
      end
      resources :audit_logs, only: [ :index ]
      resources :notifications, only: [ :index, :show, :update ] do
        collection do
          get :unread_count
          post :mark_all_read
        end
        member do
          patch :read
        end
      end
      resources :permissions, only: [ :index, :create, :update, :destroy ]
      resources :guardian_links, only: [ :index, :create, :destroy ]
      resources :schools
      resources :users

      resources :standard_frameworks do
        get :tree, on: :member, controller: "standards", action: "tree"
      end
      resources :standards

      namespace :drive do
        post :documents, action: :create_document
        post :presentations, action: :create_presentation
        get "files/:file_id", action: :show_file, as: :file
        post :picker_token
      end

      namespace :addon do
        get :unit_plans
        get "unit_plans/:id/lessons", action: :lessons, as: :unit_plan_lessons
        get "unit_plans/:id/standards", action: :unit_plan_standards, as: :unit_plan_standards
        get :standards
        get :templates
        post :ai_generate
        post :attach
        get :me
      end
    end
  end

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check
end
