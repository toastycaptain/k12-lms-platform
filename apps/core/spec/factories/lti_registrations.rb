FactoryBot.define do
  factory :lti_registration do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "LTI Tool #{n}" }
    description { "An LTI tool registration" }
    sequence(:issuer) { |n| "https://tool#{n}.example.com" }
    sequence(:client_id) { |n| "client_#{n}" }
    auth_login_url { "https://tool.example.com/auth/login" }
    auth_token_url { "https://tool.example.com/auth/token" }
    jwks_url { "https://tool.example.com/.well-known/jwks.json" }
    sequence(:deployment_id) { |n| "deploy_#{n}" }
    status { "inactive" }
    settings { {} }
  end
end
