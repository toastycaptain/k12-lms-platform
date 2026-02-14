FactoryBot.define do
  factory :ai_invocation do
    association :tenant
    association :user
    association :ai_provider_config
    task_type { "lesson_generation" }
    provider_name { "openai" }
    model { "gpt-4o" }
    status { "pending" }
    context { {} }
  end
end
