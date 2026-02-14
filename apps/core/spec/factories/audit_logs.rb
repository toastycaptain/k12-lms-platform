FactoryBot.define do
  factory :audit_log do
    association :tenant
    association :user
    action { "create" }
    auditable_type { "User" }
    auditable_id { 1 }
    changes_data { {} }
    metadata { {} }
    ip_address { "127.0.0.1" }
    user_agent { "RSpec" }
  end
end
