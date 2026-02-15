FactoryBot.define do
  factory :ai_provider_config do
    association :tenant
    association :created_by, factory: :user
    provider_name { "anthropic" }
    display_name { "Claude" }
    default_model { "claude-sonnet-4-5-20250929" }
    status { "active" }
    available_models { [ "claude-sonnet-4-5-20250929" ] }
    settings { {} }
  end
end
