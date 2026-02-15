FactoryBot.define do
  factory :notification do
    tenant
    user { association :user, tenant: tenant }
    actor { association :user, tenant: tenant }
    notification_type { "assignment_published" }
    title { "New assignment posted" }
    message { "Check the latest assignment." }
    url { "/learn/dashboard" }
  end
end
