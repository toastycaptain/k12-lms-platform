FactoryBot.define do
  factory :ai_task_policy do
    association :tenant
    association :ai_provider_config
    association :created_by, factory: :user
    task_type { "lesson_generation" }
    allowed_roles { [ "admin", "curriculum_lead", "teacher" ] }
    enabled { true }
    max_tokens_limit { 4096 }
    temperature_limit { 1.0 }
    requires_approval { false }
    settings { {} }
  end
end
