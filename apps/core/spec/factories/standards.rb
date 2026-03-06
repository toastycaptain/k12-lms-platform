FactoryBot.define do
  factory :standard do
    association :tenant
    standard_framework { association(:standard_framework, tenant: tenant) }
    sequence(:code) { |n| "STD.#{n}" }
    kind { "standard" }
    label { nil }
    identifier { nil }
    metadata { {} }
    description { "A standard description" }
    grade_band { "K-2" }
    parent { nil }
  end
end
