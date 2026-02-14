FactoryBot.define do
  factory :ai_provider_config do
    association :tenant
    association :created_by, factory: :user
    provider_name { "openai" }
    display_name { "OpenAI" }
    status { "inactive" }
    default_model { "gpt-4o" }
    available_models { [ "gpt-4o", "gpt-4o-mini" ] }
    api_key { "sk-test-key-123" }
    settings { {} }
  end
end
