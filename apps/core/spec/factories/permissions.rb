FactoryBot.define do
  factory :permission do
    tenant
    role { association :role, tenant: tenant }
    resource { "courses" }
    action { "read" }
    granted { true }
  end
end
