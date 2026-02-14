FactoryBot.define do
  factory :standard_framework do
    association :tenant
    sequence(:name) { |n| "Framework #{n}" }
    jurisdiction { "State" }
    subject { "Mathematics" }
    version { "2024" }
  end
end
