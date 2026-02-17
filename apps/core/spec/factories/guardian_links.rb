FactoryBot.define do
  factory :guardian_link do
    tenant
    guardian { association :user, tenant: tenant }
    student { association :user, tenant: tenant }
    relationship { "parent" }
    status { "active" }
  end
end
