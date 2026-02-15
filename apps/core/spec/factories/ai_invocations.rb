FactoryBot.define do
  factory :ai_invocation do
    association :tenant
    association :user
    association :ai_provider_config
    association :ai_task_policy
    provider_name { ai_provider_config.provider_name }
    model { ai_task_policy.model_name }
    task_type { ai_task_policy.task_type }
    status { "completed" }
    context { {} }
    started_at { 2.seconds.ago }
    completed_at { Time.current }
    duration_ms { 2000 }
  end
end
