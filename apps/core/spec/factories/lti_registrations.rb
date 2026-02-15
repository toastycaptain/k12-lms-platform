FactoryBot.define do
  factory :lti_registration do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "LTI Tool #{n}" }
    sequence(:issuer) { |n| "https://issuer#{n}.example.com" }
    sequence(:client_id) { |n| "client-#{n}" }
    sequence(:deployment_id) { |n| "deployment-#{n}" }
    auth_login_url { "https://tool.example.com/auth/login" }
    auth_token_url { "https://tool.example.com/auth/token" }
    jwks_url { "https://tool.example.com/.well-known/jwks.json" }
    description { "LTI registration" }
    status { "inactive" }
    settings { {} }
  end
end
