FactoryBot.define do
  factory :data_retention_policy do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "Retention Policy #{n}" }
    entity_type { "audit_log" }
    retention_days { 90 }
    action { "delete" }
    enabled { true }
    settings { {} }
  end
end
