FactoryBot.define do
  factory :sync_run do
    association :tenant
    association :integration_config
    association :triggered_by, factory: :user
    sync_type { "course_sync" }
    direction { "push" }
    status { "pending" }
  end
end
