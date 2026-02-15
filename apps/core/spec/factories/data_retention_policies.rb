FactoryBot.define do
  factory :data_retention_policy do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "Retention Policy #{n}" }
    entity_type { "AuditLog" }
    action { "delete" }
    retention_days { 30 }
    enabled { true }
    settings { {} }
  end
end
