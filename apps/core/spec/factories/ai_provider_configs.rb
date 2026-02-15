FactoryBot.define do
  factory :ai_provider_config do
    association :tenant
    association :created_by, factory: :user
    provider_name { "fake" }
    display_name { "Fake Provider" }
    default_model { "fake-model" }
    status { "active" }
    available_models { [ "fake-model" ] }
    settings { {} }
  end
end
