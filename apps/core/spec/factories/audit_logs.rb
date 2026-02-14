FactoryBot.define do
  factory :audit_log do
    association :tenant
    actor { association(:user, tenant: tenant) }
    event_type { "test.event" }
    metadata { {} }
    created_at { Time.current }
  end
end
