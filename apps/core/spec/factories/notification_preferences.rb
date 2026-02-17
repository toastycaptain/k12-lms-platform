FactoryBot.define do
  factory :notification_preference do
    tenant
    user { association :user, tenant: tenant }
    event_type { "assignment_created" }
    in_app { true }
    email { true }
    email_frequency { "immediate" }
  end
end
