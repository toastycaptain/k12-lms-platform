FactoryBot.define do
  factory :ai_task_policy do
    association :tenant
    association :created_by, factory: :user
    association :ai_provider_config
    task_type { "lesson_plan" }
    enabled { true }
    allowed_roles { [ "teacher", "admin" ] }
    model_override { nil }
    max_tokens_limit { 4096 }
    temperature_limit { 1.0 }
    requires_approval { false }
    settings { {} }
  end
end
