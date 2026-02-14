FactoryBot.define do
  factory :standard do
    association :tenant
    association :standard_framework
    sequence(:code) { |n| "STD.#{n}" }
    description { "A standard description" }
    grade_band { "K-2" }
    parent { nil }
  end
end
