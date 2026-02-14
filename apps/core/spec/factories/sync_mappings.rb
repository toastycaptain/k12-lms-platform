FactoryBot.define do
  factory :sync_mapping do
    association :tenant
    association :integration_config
    local_type { "Course" }
    sequence(:local_id) { |n| n }
    external_type { "classroom_course" }
    sequence(:external_id) { |n| "ext_#{n}" }
    metadata { {} }
    last_synced_at { nil }
  end
end
