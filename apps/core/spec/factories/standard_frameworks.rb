FactoryBot.define do
  factory :standard_framework do
    association :tenant
    sequence(:name) { |n| "Framework #{n}" }
    sequence(:key) { |n| "framework_#{n}" }
    jurisdiction { "State" }
    subject { "Mathematics" }
    version { "2024" }
    framework_kind { "standard" }
    status { "active" }
    metadata { {} }
  end
end
